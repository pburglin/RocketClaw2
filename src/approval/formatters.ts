import type { ApprovalRequest } from './store.js';

export function formatApprovals(items: ApprovalRequest[]): string {
  if (items.length === 0) return 'No approval requests found.';
  return items
    .map((item) => `${item.id} | ${item.kind} | ${item.target} | ${item.status} | ${item.detail}`)
    .join('\n');
}

export function formatApprovalSummary(items: ApprovalRequest[]): string {
  const pending = items.filter((item) => item.status === 'pending').length;
  const approved = items.filter((item) => item.status === 'approved').length;
  const rejected = items.filter((item) => item.status === 'rejected').length;
  return [
    `Total approvals: ${items.length}`,
    `Pending: ${pending}`,
    `Approved: ${approved}`,
    `Rejected: ${rejected}`,
  ].join('\n');
}
