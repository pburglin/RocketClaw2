import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDefaultProjectRoot } from '../config/app-paths.js';

export const ApprovalRequestSchema = z.object({
  id: z.string(),
  kind: z.enum(['tool-write', 'message-send']),
  target: z.string(),
  detail: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
});

export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

function getApprovalPath(root = getDefaultProjectRoot()): string {
  return path.join(root, 'approvals.json');
}

export async function loadApprovals(root = getDefaultProjectRoot()): Promise<ApprovalRequest[]> {
  try {
    const raw = await fs.readFile(getApprovalPath(root), 'utf8');
    return z.array(ApprovalRequestSchema).parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function saveApprovals(items: ApprovalRequest[], root = getDefaultProjectRoot()): Promise<void> {
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(getApprovalPath(root), JSON.stringify(items, null, 2));
}

export async function createApprovalRequest(input: Omit<ApprovalRequest, 'id' | 'status' | 'createdAt'>, root = getDefaultProjectRoot()): Promise<ApprovalRequest> {
  const approvals = await loadApprovals(root);
  const item: ApprovalRequest = {
    id: randomUUID(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...input,
  };
  approvals.push(item);
  await saveApprovals(approvals, root);
  return item;
}

export async function resolveApprovalRequest(id: string, status: 'approved' | 'rejected', root = getDefaultProjectRoot()): Promise<ApprovalRequest> {
  const approvals = await loadApprovals(root);
  const item = approvals.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`Approval request not found: ${id}`);
  }
  item.status = status;
  item.resolvedAt = new Date().toISOString();
  await saveApprovals(approvals, root);
  return item;
}
