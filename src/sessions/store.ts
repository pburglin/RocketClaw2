import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDefaultProjectRoot } from '../config/app-paths.js';
import type { SessionMessage, SessionRecord } from './types.js';

const SessionMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['system', 'user', 'assistant']),
  text: z.string(),
  createdAt: z.string(),
});

const SessionRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(SessionMessageSchema),
});

function getSessionsDir(root = getDefaultProjectRoot()): string {
  return path.join(root, 'sessions');
}

function getSessionFile(id: string, root = getDefaultProjectRoot()): string {
  return path.join(getSessionsDir(root), `${id}.json`);
}

export async function ensureSessionsDir(root = getDefaultProjectRoot()): Promise<void> {
  await fs.mkdir(getSessionsDir(root), { recursive: true });
}

export async function createSession(title: string, root = getDefaultProjectRoot()): Promise<SessionRecord> {
  await ensureSessionsDir(root);
  const now = new Date().toISOString();
  const session: SessionRecord = {
    id: randomUUID(),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  await fs.writeFile(getSessionFile(session.id, root), JSON.stringify(session, null, 2));
  return session;
}

export async function loadSession(id: string, root = getDefaultProjectRoot()): Promise<SessionRecord | null> {
  try {
    const raw = await fs.readFile(getSessionFile(id, root), 'utf8');
    return SessionRecordSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function listSessions(root = getDefaultProjectRoot()): Promise<SessionRecord[]> {
  await ensureSessionsDir(root);
  const files = await fs.readdir(getSessionsDir(root));
  const sessions: SessionRecord[] = [];
  for (const file of files.filter((name) => name.endsWith('.json'))) {
    const raw = await fs.readFile(path.join(getSessionsDir(root), file), 'utf8');
    sessions.push(SessionRecordSchema.parse(JSON.parse(raw)));
  }
  return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function appendMessage(
  sessionId: string,
  role: SessionMessage['role'],
  text: string,
  root = getDefaultProjectRoot(),
): Promise<SessionRecord> {
  const session = await loadSession(sessionId, root);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  const message: SessionMessage = {
    id: randomUUID(),
    role,
    text,
    createdAt: new Date().toISOString(),
  };
  session.messages.push(message);
  session.updatedAt = message.createdAt;
  await fs.writeFile(getSessionFile(session.id, root), JSON.stringify(session, null, 2));
  return session;
}
