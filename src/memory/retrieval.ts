import { getDefaultProjectRoot } from '../config/app-paths.js';
import { listSessions } from '../sessions/store.js';

export type RetrievalHit = {
  sessionId: string;
  sessionTitle: string;
  messageId: string;
  role: 'system' | 'user' | 'assistant';
  text: string;
  createdAt: string;
  score: number;
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
}

export function scoreTextMatch(query: string, messageText: string): number {
  const hay = messageText.toLowerCase();
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return 0;

  if (hay === trimmedQuery) return 140;
  if (hay.startsWith(trimmedQuery)) return 110;
  if (hay.includes(trimmedQuery)) return 90;

  const queryTokens = tokenize(trimmedQuery);
  if (queryTokens.length === 0) return 0;

  const messageTokens = new Set(tokenize(hay));
  let matchedTokens = 0;
  for (const token of queryTokens) {
    if (messageTokens.has(token)) matchedTokens += 1;
  }

  if (matchedTokens === 0) return 0;

  const coverageScore = Math.round((matchedTokens / queryTokens.length) * 60);
  const densityBonus = Math.min(queryTokens.length, matchedTokens) * 10;
  return coverageScore + densityBonus;
}

export async function searchSessionMemory(query: string, root = getDefaultProjectRoot()): Promise<RetrievalHit[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const sessions = await listSessions(root);
  const hits: RetrievalHit[] = [];

  for (const session of sessions) {
    for (const message of session.messages) {
      const score = scoreTextMatch(q, message.text);
      if (score <= 0) continue;
      hits.push({
        sessionId: session.id,
        sessionTitle: session.title,
        messageId: message.id,
        role: message.role,
        text: message.text,
        createdAt: message.createdAt,
        score,
      });
    }
  }

  return hits.sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt));
}
