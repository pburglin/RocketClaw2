import type { SessionRecord } from '../sessions/types.js';
import type { SemanticMemoryEntry } from '../memory/semantic-store.js';

export function formatSessionSummary(sessions: SessionRecord[]): string {
  if (sessions.length === 0) return 'No sessions found.';
  return sessions
    .map((session) => {
      const count = session.messages.length;
      return `${session.id} | ${session.title} | messages=${count} | updated=${session.updatedAt}`;
    })
    .join('\n');
}

export function formatSessionDetail(session: SessionRecord): string {
  const lines = [
    `Session: ${session.title}`,
    `ID: ${session.id}`,
    `Created: ${session.createdAt}`,
    `Updated: ${session.updatedAt}`,
    `Messages: ${session.messages.length}`,
    '',
  ];
  for (const message of session.messages.slice(-10)) {
    lines.push(`[${message.role}] ${message.text}`);
  }
  return lines.join('\n');
}

export function formatSemanticMemory(entries: SemanticMemoryEntry[]): string {
  if (entries.length === 0) return 'No semantic memory entries found.';
  return entries
    .map((entry) => `${entry.id} | salience=${entry.salience} | tags=${entry.tags.join(',')} | ${entry.text}`)
    .join('\n');
}

export function formatSessionStats(stats: { sessionCount: number; messageCount: number; userMessages: number; assistantMessages: number; systemMessages: number; latestUpdatedAt: string | null; }): string {
  return [
    `Sessions: ${stats.sessionCount}`,
    `Messages: ${stats.messageCount}`,
    `User: ${stats.userMessages}`,
    `Assistant: ${stats.assistantMessages}`,
    `System: ${stats.systemMessages}`,
    `Latest update: ${stats.latestUpdatedAt ?? 'n/a'}`,
  ].join('\n');
}
