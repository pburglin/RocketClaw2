import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getMemoryDir, getDefaultProjectRoot } from '../config/app-paths.js';

export const SemanticMemoryEntrySchema = z.object({
  id: z.string(),
  text: z.string(),
  sourceSessionId: z.string().optional(),
  sourceMessageId: z.string().optional(),
  salience: z.number(),
  createdAt: z.string(),
  tags: z.array(z.string()).default([]),
});

export type SemanticMemoryEntry = z.infer<typeof SemanticMemoryEntrySchema>;

function getSemanticMemoryPath(root = getDefaultProjectRoot()): string {
  return path.join(getMemoryDir(root), 'semantic-memory.json');
}

export async function loadSemanticMemory(root = getDefaultProjectRoot()): Promise<SemanticMemoryEntry[]> {
  try {
    const raw = await fs.readFile(getSemanticMemoryPath(root), 'utf8');
    return z.array(SemanticMemoryEntrySchema).parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function saveSemanticMemory(entries: SemanticMemoryEntry[], root = getDefaultProjectRoot()): Promise<void> {
  await fs.mkdir(getMemoryDir(root), { recursive: true });
  await fs.writeFile(getSemanticMemoryPath(root), JSON.stringify(entries.map((e) => SemanticMemoryEntrySchema.parse(e)), null, 2));
}

export async function addSemanticMemory(
  input: Omit<SemanticMemoryEntry, 'id' | 'createdAt'>,
  root = getDefaultProjectRoot(),
): Promise<SemanticMemoryEntry> {
  const entries = await loadSemanticMemory(root);
  const entry: SemanticMemoryEntry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  entries.push(entry);
  await saveSemanticMemory(entries, root);
  return entry;
}
