import type { CodingHarnessResult, HarnessPlan, ValidationResult } from './coding-harness.js';

export function formatValidationResult(r: ValidationResult): string {
  const status = r.passed ? 'PASSED' : 'FAILED';
  const lines = [
    `Harness Validate | ${status}`,
    `Run:   ${r.runId}`,
    `Files: ${r.codeBlocksApplied} code block(s) applied to ${r.workspace}`,
  ];
  if (r.error) {
    lines.push(`Error: ${r.error}`);
  } else {
    lines.push(`stdout: ${r.stdout || '(empty)'}`);
    lines.push(`stderr: ${r.stderr || '(empty)'}`);
  }
  return lines.join('\n');
}

export function formatHarnessPlan(plan: HarnessPlan): string {
  return [
    'Harness Plan | READY FOR REVIEW',
    `Workspace: ${plan.workspace}`,
    `Task: ${plan.task}`,
    `Approval: ${plan.approvalStatus}${plan.approvedAt ? ` (${plan.approvedAt})` : ''}${plan.approvalRequestId ? ` | request=${plan.approvalRequestId}` : ''}`,
    `Validate command: ${plan.validateCommand}`,
    `Run ID: ${plan.runId || 'n/a'}`,
    `Artifact: ${plan.artifactPath || 'n/a'}`,
    '',
    plan.planText || 'n/a',
  ].join('\n');
}

export function formatCodingHarnessResult(result: CodingHarnessResult): string {
  return [
    `Status: ${result.ok ? 'ok' : 'failed'}`,
    `Workspace: ${result.workspace}`,
    `Task: ${result.task}`,
    `Iterations: ${result.iterations}`,
    `Last guidance: ${result.lastGuidance || 'n/a'}`,
    `Last validation stdout: ${result.lastValidationStdout || 'n/a'}`,
    `Last validation stderr: ${result.lastValidationStderr || 'n/a'}`,
    `Validate command: ${result.validateCommand || 'n/a'}`,
    `Run ID: ${result.runId || 'n/a'}`,
    `Artifact: ${result.artifactPath || 'n/a'}`,
  ].join('\n');
}
