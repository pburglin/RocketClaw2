import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { getHarnessRunsDir } from '../config/app-paths.js';

export type IterationEntry = {
  iteration: number;
  timestamp: string;
  guidance: string;
  filesCreated: string[];
  filesModified: string[];
  validationPassed: boolean;
  validationStdout: string;
  validationStderr: string;
};

export async function saveIterationEntry(
  runId: string,
  entry: IterationEntry,
  root?: string,
): Promise<void> {
  const dir = path.join(getHarnessRunsDir(root ?? ''), runId);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `iteration-${String(entry.iteration).padStart(3, '0')}.json`);
  await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
}

export async function loadIterationEntries(
  runId: string,
  root?: string,
): Promise<IterationEntry[]> {
  const dir = path.join(getHarnessRunsDir(root ?? ''), runId);
  try {
    const files = (await fs.readdir(dir))
      .filter((f) => f.startsWith('iteration-') && f.endsWith('.json'))
      .sort();
    const entries: IterationEntry[] = [];
    for (const file of files) {
      const raw = await fs.readFile(path.join(dir, file), 'utf8');
      entries.push(JSON.parse(raw));
    }
    return entries;
  } catch {
    return [];
  }
}
