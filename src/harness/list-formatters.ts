export function formatHarnessRuns(items: Array<Record<string, unknown>>): string {
  if (items.length === 0) return 'No harness runs found.';
  return items
    .map((item) => `${item.runId} | kind=${item.kind ?? 'run'} | ok=${item.ok} | approval=${item.approvalStatus ?? 'n/a'} | workspace=${item.workspace} | task=${item.task}`)
    .join('\n');
}

export function formatHarnessRunSummary(items: Array<Record<string, unknown>>): string {
  const total = items.length;
  const plans = items.filter((item) => (item.kind ?? 'run') === 'plan').length;
  const runs = total - plans;
  const approvedPlans = items.filter((item) => item.kind === 'plan' && item.approvalStatus === 'approved').length;
  const draftPlans = items.filter((item) => item.kind === 'plan' && item.approvalStatus === 'draft').length;
  const failedRuns = items.filter((item) => (item.kind ?? 'run') !== 'plan' && item.ok === false).length;
  return [
    `Total artifacts: ${total}`,
    `Plans: ${plans}`,
    `Runs: ${runs}`,
    `Approved plans: ${approvedPlans}`,
    `Draft plans: ${draftPlans}`,
    `Failed runs: ${failedRuns}`,
  ].join('\n');
}
