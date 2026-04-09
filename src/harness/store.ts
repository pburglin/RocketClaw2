import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { getDefaultProjectRoot, getHarnessRunsDir } from '../config/app-paths.js';
import type { CodingHarnessResult } from './coding-harness.js';

export async function saveHarnessRun(
  result: CodingHarnessResult,
  root = getDefaultProjectRoot(),
): Promise<{ runId: string; path: string }> {
  const runId = randomUUID();
  const dir = getHarnessRunsDir(root);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${runId}.json`);
  await fs.writeFile(filePath, JSON.stringify({ runId, ...result }, null, 2));
  return { runId, path: filePath };
}
