import type { CodingHarnessResult } from './coding-harness.js';

export function formatCodingHarnessResult(result: CodingHarnessResult): string {
  return [
    `Status: ${result.ok ? 'ok' : 'failed'}`,
    `Workspace: ${result.workspace}`,
    `Task: ${result.task}`,
    `Iterations: ${result.iterations}`,
    `Last guidance: ${result.lastGuidance || 'n/a'}`,
    `Last validation stdout: ${result.lastValidationStdout || 'n/a'}`,
    `Last validation stderr: ${result.lastValidationStderr || 'n/a'}`,
    `Run ID: ${result.runId || 'n/a'}`,
    `Artifact: ${result.artifactPath || 'n/a'}`,
  ].join('\n');
}
