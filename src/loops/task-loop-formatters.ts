import type { TaskLoopResult } from './task-loop.js';

export function formatTaskLoopResult(result: TaskLoopResult): string {
  return [
    `Status: ${result.ok ? 'ok' : 'failed'}`,
    `Iterations: ${result.iterations}`,
    `Last guidance: ${result.lastGuidance || 'n/a'}`,
    `Last validation stdout: ${result.lastValidationStdout || 'n/a'}`,
    `Last validation stderr: ${result.lastValidationStderr || 'n/a'}`,
  ].join('\n');
}
