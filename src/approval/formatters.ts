import type { ApprovalRequest } from './store.js';

export function formatApprovals(items: ApprovalRequest[]): string {
  if (items.length === 0) return 'No approval requests found.';
  return items
    .map((item) => `${item.id} | ${item.kind} | ${item.target} | ${item.status} | ${item.detail}`)
    .join('\n');
}
