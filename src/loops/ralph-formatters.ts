import type { RalphLoopResult } from './ralph.js';

export function formatRalphLoopResult(result: RalphLoopResult): string {
  const statusLine = `Status: ${result.ok ? 'ok' : 'failed'}`;
  const iterationsLine = `Iterations: ${result.iterations}`;
  const conditionLine = `Condition: ${result.condition}`;
  const stdoutLine = `Last stdout: ${result.lastStdout || 'n/a'}`;
  const stderrLine = `Last stderr: ${result.lastStderr || 'n/a'}`;

  // If the loop failed, provide a hint about the condition not being met
  let hint = '';
  if (!result.ok) {
    hint = `\nHint: The success condition was not met within ${result.iterations} iteration(s).`;
  }

  return [statusLine, iterationsLine, conditionLine, stdoutLine, stderrLine, hint].filter(line => line.trim() !== '').join('\n');
}