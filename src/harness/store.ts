import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { getDefaultProjectRoot, getHarnessRunsDir } from '../config/app-paths.js';
import type { CodingHarnessResult, HarnessPlan } from './coding-harness.js';
import { resolveApprovalRequest } from '../approval/store.js';
import { loadIterationEntries } from './iteration-store.js';

export async function saveHarnessRun(
  result: CodingHarnessResult | HarnessPlan,
  root = getDefaultProjectRoot(),
  explicitRunId?: string,
): Promise<{ runId: string; path: string }> {
  const runId = explicitRunId ?? result.runId ?? randomUUID();
  const dir = getHarnessRunsDir(root);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${runId}.json`);
  const existing = await loadHarnessRun(runId, root);
  const createdAt = String((result as Record<string, unknown>).createdAt ?? existing?.createdAt ?? new Date().toISOString());
  await fs.writeFile(filePath, JSON.stringify({ runId, createdAt, updatedAt: new Date().toISOString(), ...existing, ...result }, null, 2));
  return { runId, path: filePath };
}

export async function loadHarnessRuns(root = getDefaultProjectRoot()): Promise<Array<Record<string, unknown>>> {
  try {
    const dir = getHarnessRunsDir(root);
    const files = await fs.readdir(dir);
    const runs = [];
    for (const file of files.filter((name) => name.endsWith('.json'))) {
      const raw = await fs.readFile(path.join(dir, file), 'utf8');
      runs.push(JSON.parse(raw));
    }
    return runs.sort((a, b) => {
      const aUpdated = Date.parse(String((a as any).updatedAt ?? (a as any).createdAt ?? '')) || 0;
      const bUpdated = Date.parse(String((b as any).updatedAt ?? (b as any).createdAt ?? '')) || 0;
      if (aUpdated !== bUpdated) return bUpdated - aUpdated;
      return String((b as any).runId).localeCompare(String((a as any).runId));
    });
  } catch {
    return [];
  }
}

export async function loadHarnessRun(runId: string, root = getDefaultProjectRoot()): Promise<Record<string, unknown> | null> {
  try {
    const filePath = path.join(getHarnessRunsDir(root), `${runId}.json`);
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function findLatestHarnessArtifact(
  predicate: (artifact: Record<string, unknown>) => boolean,
  root = getDefaultProjectRoot(),
): Promise<Record<string, unknown> | null> {
  const runs = await loadHarnessRuns(root);
  return runs.find(predicate) ?? null;
}

export async function loadHarnessRunnableInput(
  runId: string,
  root = getDefaultProjectRoot(),
): Promise<{ workspace: string; task: string; validateCommand: string; approvalStatus?: string } | null> {
  const run = await loadHarnessRun(runId, root);
  if (!run) return null;
  const workspace = String(run.workspace ?? '');
  const task = String(run.task ?? '');
  const validateCommand = String(run.validateCommand ?? '');
  const approvalStatus = typeof run.approvalStatus === 'string' ? run.approvalStatus : undefined;
  if (!workspace || !task || !validateCommand) return null;
  return { workspace, task, validateCommand, approvalStatus };
}

export async function buildHarnessChain(
  artifactId: string,
  root = getDefaultProjectRoot(),
): Promise<{ root: Record<string, unknown>; plan: Record<string, unknown> | null; resumes: Record<string, unknown>[]; nodeSummaries: Record<string, { iterations: number; latestPassed: boolean | null; latestStdout: string; latestStderr: string; latestCriticInsight: string }> }> {
  const rootArtifact = await loadHarnessRun(artifactId, root);
  if (!rootArtifact) {
    throw new Error(`Harness artifact not found: ${artifactId}`);
  }
  const all = await loadHarnessRuns(root);
  const executedPlanId = typeof rootArtifact.executedPlanId === 'string' ? rootArtifact.executedPlanId : null;
  const plan = executedPlanId ? (all.find((item) => String(item.runId) === executedPlanId) ?? null) : (rootArtifact.kind === 'plan' ? rootArtifact : null);

  const queue = [String(rootArtifact.runId ?? '')];
  const seen = new Set<string>();
  const resumes: Record<string, unknown>[] = [];
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    for (const item of all) {
      const resumedFrom = String(item.resumedFrom ?? '');
      const runId = String(item.runId ?? '');
      if (resumedFrom === parentId && runId && !seen.has(runId)) {
        seen.add(runId);
        resumes.push(item);
        queue.push(runId);
      }
    }
  }

  const nodes = [rootArtifact, ...resumes];
  const nodeSummaries: Record<string, { iterations: number; latestPassed: boolean | null; latestStdout: string; latestStderr: string; latestCriticInsight: string }> = {};
  for (const node of nodes) {
    const runId = String(node.runId ?? '');
    if (!runId) continue;
    const entries = await loadIterationEntries(runId, root);
    const latest = entries.length > 0 ? entries[entries.length - 1]! : null;
    nodeSummaries[runId] = {
      iterations: entries.length,
      latestPassed: latest ? latest.validationPassed : null,
      latestStdout: latest?.validationStdout ?? '',
      latestStderr: latest?.validationStderr ?? '',
      latestCriticInsight: latest?.criticInsight ?? '',
    };
  }

  return { root: rootArtifact, plan, resumes, nodeSummaries };
}

export async function approveHarnessPlan(
  runId: string,
  root = getDefaultProjectRoot(),
): Promise<Record<string, unknown>> {
  const run = await loadHarnessRun(runId, root);
  if (!run) {
    throw new Error(`Harness artifact not found: ${runId}`);
  }
  if (run.kind !== 'plan') {
    throw new Error(`Harness artifact is not a plan: ${runId}`);
  }
  const updated = {
    ...run,
    approvalStatus: 'approved',
    approvedAt: new Date().toISOString(),
  };
  if (typeof run.approvalRequestId === 'string' && run.approvalRequestId) {
    try {
      await resolveApprovalRequest(run.approvalRequestId, 'approved', root);
    } catch {
      // keep plan approval independent if queue item is missing
    }
  }
  await saveHarnessRun(updated as HarnessPlan, root, runId);
  return updated;
}
