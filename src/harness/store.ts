import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { getDefaultProjectRoot, getHarnessRunsDir } from '../config/app-paths.js';
import type { CodingHarnessResult } from './coding-harness.js';

export async function saveHarnessRun(
  result: CodingHarnessResult,
  root = getDefaultProjectRoot(),
  explicitRunId?: string,
): Promise<{ runId: string; path: string }> {
  const runId = explicitRunId ?? result.runId ?? randomUUID();
  const dir = getHarnessRunsDir(root);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${runId}.json`);
  await fs.writeFile(filePath, JSON.stringify({ runId, ...result }, null, 2));
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
    return runs.sort((a, b) => String((b as any).runId).localeCompare(String((a as any).runId)));
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
