import { describeHarnessNextStep } from './formatters.js';

export function formatHarnessRuns(items: Array<Record<string, unknown>>): string {
  if (items.length === 0) return 'No harness runs found.';
  return items
    .map((item) => `${item.runId} | kind=${item.kind ?? 'run'} | ok=${item.ok} | approval=${item.approvalStatus ?? 'n/a'} | evaluation=${item.evaluationDecision ?? 'n/a'} | plan=${item.executedPlanId ?? 'n/a'} | resumedFrom=${item.resumedFrom ?? 'n/a'} | sourceHandoff=${item.sourceHandoffId ?? 'n/a'} | workspace=${item.workspace} | task=${item.task} | next=${describeHarnessNextStep(item)}`)
    .join('\n');
}

export function formatHarnessRunSummary(items: Array<Record<string, unknown>>): string {
  const total = items.length;
  const plans = items.filter((item) => (item.kind ?? 'run') === 'plan').length;
  const runs = total - plans;
  const approvedPlans = items.filter((item) => item.kind === 'plan' && item.approvalStatus === 'approved').length;
  const draftPlans = items.filter((item) => item.kind === 'plan' && item.approvalStatus === 'draft').length;
  const failedRuns = items.filter((item) => (item.kind ?? 'run') !== 'plan' && item.ok === false).length;
  const acceptedEvaluations = items.filter((item) => item.evaluationDecision === 'accepted').length;
  const rejectedEvaluations = items.filter((item) => item.evaluationDecision === 'rejected').length;
  const needsReviewEvaluations = items.filter((item) => item.evaluationDecision === 'needs-review').length;
  const sourcedFromHandoffs = items.filter((item) => typeof item.sourceHandoffId === 'string' && item.sourceHandoffId.trim().length > 0).length;
  return [
    `Total artifacts: ${total}`,
    `Plans: ${plans}`,
    `Runs: ${runs}`,
    `Approved plans: ${approvedPlans}`,
    `Draft plans: ${draftPlans}`,
    `Failed runs: ${failedRuns}`,
    `Accepted evaluations: ${acceptedEvaluations}`,
    `Rejected evaluations: ${rejectedEvaluations}`,
    `Needs-review evaluations: ${needsReviewEvaluations}`,
    `Handoff-derived artifacts: ${sourcedFromHandoffs}`,
  ].join('\n');
}
