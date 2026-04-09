import type { RalphLoopResult } from './ralph.js';

export function formatRalphLoopResult(result: RalphLoopResult): string {
  return [
    `Status: ${result.ok ? 'ok' : 'failed'}`,
    `Iterations: ${result.iterations}`,
    `Condition: ${result.condition}`,
    `Last stdout: ${result.lastStdout || 'n/a'}`,
    `Last stderr: ${result.lastStderr || 'n/a'}`,
  ].join('\n');
}
