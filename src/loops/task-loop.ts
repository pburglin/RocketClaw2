import type { AppConfig } from '../config/load-config.js';
import { runLlmQuery } from '../llm/client.js';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execCb);

export type TaskLoopResult = {
  ok: boolean;
  iterations: number;
  lastGuidance: string;
  lastValidationStdout: string;
  lastValidationStderr: string;
};

export async function runTaskLoop(
  config: AppConfig,
  input: { task: string; validateCommand: string; maxIterations: number },
): Promise<TaskLoopResult> {
  let lastGuidance = '';
  let lastValidationStdout = '';
  let lastValidationStderr = '';

  for (let i = 1; i <= input.maxIterations; i += 1) {
    lastGuidance = await runLlmQuery(
      config,
      [
        'You are helping with an iterative development loop.',
        `Task: ${input.task}`,
        'Provide the next implementation guidance concisely based on the task and the latest validation feedback.',
        `Previous validation stdout: ${lastValidationStdout || 'n/a'}`,
        `Previous validation stderr: ${lastValidationStderr || 'n/a'}`,
      ].join('\n'),
    );

    try {
      const { stdout, stderr } = await exec(input.validateCommand);
      lastValidationStdout = stdout.trim();
      lastValidationStderr = stderr.trim();
      return {
        ok: true,
        iterations: i,
        lastGuidance,
        lastValidationStdout,
        lastValidationStderr,
      };
    } catch (error) {
      const err = error as { stdout?: string; stderr?: string; message?: string };
      lastValidationStdout = (err.stdout ?? '').trim();
      lastValidationStderr = (err.stderr ?? err.message ?? '').trim();
    }
  }

  return {
    ok: false,
    iterations: input.maxIterations,
    lastGuidance,
    lastValidationStdout,
    lastValidationStderr,
  };
}
