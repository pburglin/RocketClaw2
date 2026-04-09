import type { ApprovalRequest } from './store.js';

export function describeApprovalNextStep(item: ApprovalRequest): string {
  if (item.kind === 'harness-plan') {
    if (item.status === 'pending') return `Resolve approval, then run: rocketclaw2 harness-run --id ${item.target} --require-approved-plan`;
    if (item.status === 'approved') return `Run: rocketclaw2 harness-run --id ${item.target} --require-approved-plan`;
    return 'No further runtime action is recommended unless the harness plan approval is recreated.';
  }
  if (item.status === 'pending') return `Resolve approval, then rerun the governed ${item.kind} action.`;
  if (item.status === 'approved') return `Re-run the governed ${item.kind} action for ${item.target}.`;
  return 'No further runtime action is recommended unless the request is recreated.';
}


export function formatApprovals(items: ApprovalRequest[]): string {
  if (items.length === 0) return 'No approval requests found.';
  return items
    .map((item) => `${item.id} | ${item.kind} | ${item.target} | ${item.status} | ${item.detail} | next: ${describeApprovalNextStep(item)}`)
    .join('\n');
}

export function formatApprovalSummary(items: ApprovalRequest[]): string {
  const pending = items.filter((item) => item.status === 'pending').length;
  const approved = items.filter((item) => item.status === 'approved').length;
  const rejected = items.filter((item) => item.status === 'rejected').length;
  const pendingHints = items.filter((item) => item.status === 'pending').slice(0, 3).map((item) => `- ${item.target}: ${describeApprovalNextStep(item)}`).join('\n');
  return [
    `Total approvals: ${items.length}`,
    `Pending: ${pending}`,
    `Approved: ${approved}`,
    `Rejected: ${rejected}`,
    pendingHints ? `Pending next steps:\n${pendingHints}` : 'Pending next steps: n/a',
  ].join('\n');
}

export function formatPendingApprovalActions(items: ApprovalRequest[]): string {
  const pending = items.filter((item) => item.status === 'pending');
  if (pending.length === 0) return 'No pending approvals.';
  return pending
    .map((item) => `- ${item.id} | ${item.kind} | ${item.target} | ${describeApprovalNextStep(item)}`)
    .join('\n');
}
