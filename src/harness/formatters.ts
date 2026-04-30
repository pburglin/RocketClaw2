import type { CodingHarnessResult, HarnessPlan, ValidationResult } from './coding-harness.js';
import type { IterationEntry } from './iteration-store.js';

export function describeHarnessNextStep(item: Record<string, unknown>): string {
  const runId = String(item.runId ?? '');
  const kind = String(item.kind ?? 'run');
  const approvalStatus = String(item.approvalStatus ?? 'n/a');
  const ok = item.ok;

  if (kind === 'plan') {
    if (approvalStatus === 'draft') return `Approve plan: rocketclaw2 harness-approve --id ${runId}`;
    if (approvalStatus === 'approved') return `Execute plan: rocketclaw2 harness-run --id ${runId} --require-approved-plan`;
    return 'Review plan state before execution.';
  }

  if (ok === false) {
    return `Inspect or resume: rocketclaw2 harness-iterations --id ${runId} && rocketclaw2 harness-resume --id ${runId}`;
  }
  if (ok === true) {
    return `Re-validate if needed: rocketclaw2 harness-validate --id ${runId}`;
  }
  return 'Inspect artifact details to choose the next step.';
}

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
    `Edit mode: ${plan.editMode ?? 'mixed'}`,
    `Run ID: ${plan.runId || 'n/a'}`,
    `Artifact: ${plan.artifactPath || 'n/a'}`,
    `Source handoff: ${String((plan as unknown as Record<string, unknown>).sourceHandoffId ?? 'n/a')}`,
    `Next: ${describeHarnessNextStep(plan as unknown as Record<string, unknown>)}`,
    '',
    plan.planText || 'n/a',
  ].join('\n');
}

export function formatHarnessChainSummary(chain: { root: Record<string, unknown>; plan: Record<string, unknown> | null; resumes: Record<string, unknown>[]; nodeSummaries: Record<string, { iterations: number; latestPassed: boolean | null; latestStdout: string; latestStderr: string; latestCriticInsight: string }> }): string {
  const root = chain.root;
  const rootId = String(root.runId ?? 'n/a');
  const rootSummary = chain.nodeSummaries[rootId];
  const sourceHandoffId = String(root.sourceHandoffId ?? chain.plan?.sourceHandoffId ?? 'n/a');
  const sourceHandoffChain = Array.isArray(root.sourceHandoffChain)
    ? root.sourceHandoffChain.join(' -> ') || 'n/a'
    : Array.isArray(chain.plan?.sourceHandoffChain)
      ? chain.plan.sourceHandoffChain.join(' -> ') || 'n/a'
      : 'n/a';
  return [
    `ROOT RUN: ${rootId} (${String(root.kind ?? 'run')})`,
    `PLAN: ${chain.plan ? String(chain.plan.runId ?? 'n/a') : 'n/a'}`,
    `Source handoff: ${sourceHandoffId}`,
    `Source handoff chain: ${sourceHandoffChain}`,
    `Resumes: ${chain.resumes.length}`,
    `Root latest passed: ${rootSummary?.latestPassed ?? 'n/a'}`,
    `Inspect root: rocketclaw2 harness-show --id ${rootId}`,
    chain.plan ? `Inspect plan: rocketclaw2 harness-show --id ${String(chain.plan.runId)} --plan` : null,
    `Next: ${describeHarnessNextStep(root)}`,
  ].filter(Boolean).join('\n');
}

export function formatHarnessChain(chain: { root: Record<string, unknown>; plan: Record<string, unknown> | null; resumes: Record<string, unknown>[]; nodeSummaries: Record<string, { iterations: number; latestPassed: boolean | null; latestStdout: string; latestStderr: string; latestCriticInsight: string }> }): string {
  const root = chain.root;
  const rootSummary = chain.nodeSummaries[String(root.runId ?? '')];
  const sourceHandoffId = String(root.sourceHandoffId ?? chain.plan?.sourceHandoffId ?? 'n/a');
  const sourceHandoffChain = Array.isArray(root.sourceHandoffChain)
    ? root.sourceHandoffChain.join(' -> ') || 'n/a'
    : Array.isArray(chain.plan?.sourceHandoffChain)
      ? chain.plan.sourceHandoffChain.join(' -> ') || 'n/a'
      : 'n/a';
  const resumeLines = chain.resumes.length > 0
    ? chain.resumes.map((item, index) => {
        const runId = String(item.runId);
        const summary = chain.nodeSummaries[runId];
        const detail = summary?.latestPassed === false
          ? ` | stderr=${summary.latestStderr || '(empty)'}${summary.latestCriticInsight ? ` | critic=${summary.latestCriticInsight}` : ''}`
          : summary?.latestPassed === true
            ? ` | stdout=${summary.latestStdout || '(empty)'}`
            : '';
        return `- RESUME #${index + 1}: ${runId}${item.resumedFrom ? ` <= ${String(item.resumedFrom)}` : ''} | iterations=${summary?.iterations ?? 0} | latestPassed=${summary?.latestPassed ?? 'n/a'}${detail} | inspect=rocketclaw2 harness-show --id ${runId}`;
      }).join('\n')
    : 'n/a';
  return [
    `ROOT RUN: ${String(root.runId ?? 'n/a')} (${String(root.kind ?? 'run')})`,
    `Task: ${String(root.task ?? 'n/a')}`,
    `PLAN: ${chain.plan ? String(chain.plan.runId ?? 'n/a') : 'n/a'}`,
    `Source handoff: ${sourceHandoffId}`,
    `Source handoff chain: ${sourceHandoffChain}`,
    chain.plan ? `Inspect plan: rocketclaw2 harness-show --id ${String(chain.plan.runId)} --plan` : null,
    `Root iterations: ${rootSummary?.iterations ?? 0}`,
    `Inspect root: rocketclaw2 harness-show --id ${String(root.runId ?? 'n/a')}`,
    `Root latest passed: ${rootSummary?.latestPassed ?? 'n/a'}`,
    rootSummary?.latestPassed === false ? `Root latest stderr: ${rootSummary.latestStderr || '(empty)'}` : null,
    rootSummary?.latestPassed === false && rootSummary?.latestCriticInsight ? `Root critic: ${rootSummary.latestCriticInsight}` : null,
    rootSummary?.latestPassed === true ? `Root latest stdout: ${rootSummary.latestStdout || '(empty)'}` : null,
    `Resumes: ${chain.resumes.length}`,
    `Resume chain:\n${resumeLines}`,
    `Next: ${describeHarnessNextStep(root)}`,
  ].filter(Boolean).join('\n');
}

export function formatHarnessLineageView(item: Record<string, unknown>): string {
  return [
    `Run ID: ${String(item.runId ?? 'n/a')}`,
    `Kind: ${String(item.kind ?? 'run')}`,
    `Executed plan: ${String(item.executedPlanId ?? 'n/a')}`,
    `Resumed from: ${String(item.resumedFrom ?? 'n/a')}`,
    `Approval request: ${String(item.approvalRequestId ?? 'n/a')}`,
    `Approval status: ${String(item.approvalStatus ?? 'n/a')}`,
    `Source handoff: ${String(item.sourceHandoffId ?? 'n/a')}`,
    `Source handoff chain: ${Array.isArray(item.sourceHandoffChain) ? item.sourceHandoffChain.join(' -> ') || 'n/a' : 'n/a'}`,
    `Evaluation decision: ${String(item.evaluationDecision ?? 'n/a')}`,
    `Evaluation note: ${String(item.evaluationNote ?? 'n/a')}`,
    `Evaluation history entries: ${Array.isArray(item.evaluationHistory) ? item.evaluationHistory.length : 0}`,
    `Evaluated at: ${String(item.evaluatedAt ?? 'n/a')}`,
    `Next: ${describeHarnessNextStep(item)}`,
  ].join('\n');
}

export function formatHarnessGuidanceView(item: Record<string, unknown>): string {
  return [
    `Run ID: ${String(item.runId ?? 'n/a')}`,
    'Guidance:',
    String(item.lastGuidance ?? 'n/a'),
  ].join('\n');
}

export function formatHarnessValidationView(item: Record<string, unknown>): string {
  return [
    `Run ID: ${String(item.runId ?? 'n/a')}`,
    `Validation stdout: ${String(item.lastValidationStdout ?? 'n/a')}`,
    `Validation stderr: ${String(item.lastValidationStderr ?? 'n/a')}`,
    `Validate command: ${String(item.validateCommand ?? 'n/a')}`,
    `Edit mode: ${String(item.editMode ?? 'mixed')}`,
    `Iterations: ${String(item.iterations ?? 'n/a')}`,
    `Status: ${String(item.ok ?? 'n/a')}`,
    `Next: ${describeHarnessNextStep(item)}`,
  ].join('\n');
}

export function formatHarnessPlanView(item: Record<string, unknown>): string {
  return [
    `Run ID: ${String(item.runId ?? 'n/a')}`,
    `Approval: ${String(item.approvalStatus ?? 'n/a')}`,
    `Source handoff: ${String(item.sourceHandoffId ?? 'n/a')}`,
    `Source handoff chain: ${Array.isArray(item.sourceHandoffChain) ? item.sourceHandoffChain.join(' -> ') || 'n/a' : 'n/a'}`,
    `Evaluation decision: ${String(item.evaluationDecision ?? 'n/a')}`,
    `Validate command: ${String(item.validateCommand ?? 'n/a')}`,
    `Next: ${describeHarnessNextStep(item)}`,
    '',
    String(item.planText ?? 'n/a'),
  ].join('\n');
}

export function formatHarnessIterations(entries: IterationEntry[], options?: { includeGuidance?: boolean }): string {
  if (entries.length === 0) return 'No iteration entries found.';
  return entries.map((entry) => [
    `Iteration ${entry.iteration} | passed=${entry.validationPassed} | created=${entry.filesCreated.length} | modified=${entry.filesModified.length}`,
    `stdout: ${entry.validationStdout || '(empty)'}`,
    `stderr: ${entry.validationStderr || '(empty)'}`,
    entry.criticInsight ? `critic: ${entry.criticInsight}` : null,
    options?.includeGuidance ? `guidance: ${entry.guidance || '(empty)'}` : null,
  ].filter(Boolean).join('\n')).join('\n\n');
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
    `Edit mode: ${result.editMode || 'mixed'}`,
    `Run ID: ${result.runId || 'n/a'}`,
    `Executed plan: ${result.executedPlanId || 'n/a'}`,
    `Source handoff: ${result.sourceHandoffId || 'n/a'}`,
    `Artifact: ${result.artifactPath || 'n/a'}`,
    `Next: ${describeHarnessNextStep(result as unknown as Record<string, unknown>)}`,
  ].join('\n');
}
