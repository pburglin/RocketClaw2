import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execCb);

export type RalphLoopOptions = {
  command: string;
  until: 'exit-0' | 'stdout-includes';
  matchText?: string;
  maxIterations: number;
};

export type RalphLoopResult = {
  ok: boolean;
  iterations: number;
  condition: string;
  lastStdout: string;
  lastStderr: string;
};

export async function runRalphLoop(options: RalphLoopOptions): Promise<RalphLoopResult> {
  let lastStdout = '';
  let lastStderr = '';

  for (let i = 1; i <= options.maxIterations; i += 1) {
    try {
      const { stdout, stderr } = await exec(options.command);
      lastStdout = stdout.trim();
      lastStderr = stderr.trim();
      if (options.until === 'exit-0') {
        return { ok: true, iterations: i, condition: 'exit-0', lastStdout, lastStderr };
      }
      if (options.until === 'stdout-includes' && options.matchText && lastStdout.includes(options.matchText)) {
        return { ok: true, iterations: i, condition: `stdout includes: ${options.matchText}`, lastStdout, lastStderr };
      }
    } catch (error) {
      const err = error as { stdout?: string; stderr?: string; message?: string };
      lastStdout = (err.stdout ?? '').trim();
      lastStderr = (err.stderr ?? err.message ?? '').trim();
    }
  }

  return {
    ok: false,
    iterations: options.maxIterations,
    condition: options.until === 'stdout-includes' ? `stdout includes: ${options.matchText ?? ''}` : 'exit-0',
    lastStdout,
    lastStderr,
  };
}
