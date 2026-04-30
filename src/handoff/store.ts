import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDefaultProjectRoot, getHandoffsDir } from '../config/app-paths.js';

export const HandoffArtifactSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  activeGoal: z.string(),
  environment: z.object({
    profile: z.string(),
    llmModel: z.string(),
    llmRetryCount: z.number().int().min(0),
    llmApiKeyConfigured: z.boolean(),
    whatsappEnabled: z.boolean(),
    whatsappMode: z.string(),
    sessionCount: z.number().int().min(0),
    messageCount: z.number().int().min(0),
    semanticMemoryEntries: z.number().int().min(0),
    pendingApprovals: z.number().int().min(0),
    latestSessionUpdate: z.string().nullable(),
  }),
  handoff: z.object({
    owner: z.string().optional(),
    notes: z.string().optional(),
  }).default({}),
  related: z.object({
    harness: z.object({
      runId: z.string(),
      kind: z.string().optional(),
      ok: z.boolean().optional(),
      approvalStatus: z.string().optional(),
    }).optional(),
    approval: z.object({
      id: z.string(),
      kind: z.string(),
      status: z.string(),
      target: z.string(),
    }).optional(),
  }).default({}),
  parentHandoffId: z.string().optional(),
  handoffChain: z.array(z.string()),
  constraints: z.array(z.string()),
  risks: z.array(z.string()),
  nextActions: z.array(z.string()),
  source: z.object({
    worldModelCommand: z.string(),
    workspaceStatusCommand: z.string(),
    systemSummaryCommand: z.string(),
  }),
});

export type HandoffArtifact = z.infer<typeof HandoffArtifactSchema>;

function getHandoffFile(id: string, root = getDefaultProjectRoot()): string {
  return path.join(getHandoffsDir(root), `${id}.json`);
}

export async function ensureHandoffsDir(root = getDefaultProjectRoot()): Promise<void> {
  await fs.mkdir(getHandoffsDir(root), { recursive: true });
}

export async function saveHandoffArtifact(
  input: Omit<HandoffArtifact, 'id' | 'createdAt' | 'handoffChain'> & { parentHandoffId?: string },
  root = getDefaultProjectRoot(),
): Promise<HandoffArtifact> {
  await ensureHandoffsDir(root);
  let handoffChain: string[] = [];
  if (input.parentHandoffId) {
    const parent = await loadHandoffArtifact(input.parentHandoffId, root);
    handoffChain = [...(parent?.handoffChain ?? []), input.parentHandoffId];
  }
  const artifact: HandoffArtifact = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
    handoffChain,
  };
  await fs.writeFile(getHandoffFile(artifact.id, root), JSON.stringify(artifact, null, 2));
  return artifact;
}

export async function loadHandoffArtifact(id: string, root = getDefaultProjectRoot()): Promise<HandoffArtifact | null> {
  try {
    const raw = await fs.readFile(getHandoffFile(id, root), 'utf8');
    return HandoffArtifactSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function listHandoffArtifacts(root = getDefaultProjectRoot()): Promise<HandoffArtifact[]> {
  try {
    await ensureHandoffsDir(root);
    const files = (await fs.readdir(getHandoffsDir(root))).filter((file) => file.endsWith('.json')).sort();
    const artifacts = await Promise.all(files.map(async (file) => {
      const raw = await fs.readFile(path.join(getHandoffsDir(root), file), 'utf8');
      return HandoffArtifactSchema.parse(JSON.parse(raw));
    }));
    return artifacts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function loadHandoffChain(id: string, root = getDefaultProjectRoot()): Promise<HandoffArtifact[]> {
  const chain: HandoffArtifact[] = [];
  let current: HandoffArtifact | null = await loadHandoffArtifact(id, root);
  while (current) {
    chain.unshift(current);
    current = current.parentHandoffId ? (await loadHandoffArtifact(current.parentHandoffId, root)) : null;
  }
  return chain;
}
