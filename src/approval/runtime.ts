import { getDefaultProjectRoot } from '../config/app-paths.js';
import { loadApprovals, resolveApprovalRequest } from './store.js';

export async function approveAndDescribeNextStep(id: string, root = getDefaultProjectRoot()): Promise<{ id: string; status: string; nextStep: string }> {
  const approvals = await loadApprovals(root);
  const item = approvals.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`Approval request not found: ${id}`);
  }

  const resolved = await resolveApprovalRequest(id, 'approved', root);
  let nextStep = 'Re-run the original governed action with explicit approval.';
  if (item.kind === 'tool-write') {
    nextStep = `Re-run the governed tool action for ${item.target} with explicit approval semantics.`;
  }
  if (item.kind === 'message-send') {
    nextStep = `Re-run the governed messaging action for ${item.target} with explicit approval semantics.`;
  }

  return {
    id: resolved.id,
    status: resolved.status,
    nextStep,
  };
}
