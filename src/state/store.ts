import fs from 'node:fs/promises';
import { z } from 'zod';

export const StateSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  profile: z.string().default('default'),
  sessions: z.array(z.object({ id: z.string(), title: z.string(), updatedAt: z.string() })).default([]),
});

export type AppState = z.infer<typeof StateSchema>;

export async function loadState(path: string): Promise<AppState | null> {
  try {
    const raw = await fs.readFile(path, 'utf8');
    return StateSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveState(path: string, state: AppState): Promise<void> {
  await fs.mkdir(new URL('.', `file://${path}`).pathname, { recursive: true }).catch(() => {});
  await fs.writeFile(path, JSON.stringify(StateSchema.parse(state), null, 2));
}

export function createInitialState(profile = 'default'): AppState {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    updatedAt: now,
    profile,
    sessions: [],
  };
}
