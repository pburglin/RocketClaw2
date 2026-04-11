import type { SessionRecord } from '../sessions/types.js';
import type { SemanticMemoryEntry } from '../memory/semantic-store.js';
import type { RecallScoringConfig } from '../config/load-config.js';

export function formatSessionSummary(sessions: SessionRecord[]): string {
  if (sessions.length === 0) return 'No sessions found.';
  return sessions
    .map((session) => {
      const count = session.messages.length;
      return `${session.id} | ${session.title} | messages=${count} | updated=${session.updatedAt}`;
    })
    .join('\n');
}

export function formatSessionDetail(session: SessionRecord, options?: { limit?: number }): string {
  const limit = options?.limit ?? 10;
  const recentMessages = limit > 0 ? session.messages.slice(-limit) : [];
  const hiddenCount = Math.max(session.messages.length - recentMessages.length, 0);
  const lines = [
    `Session: ${session.title}`,
    `ID: ${session.id}`,
    `Created: ${session.createdAt}`,
    `Updated: ${session.updatedAt}`,
    `Messages: ${session.messages.length}`,
    ...(hiddenCount > 0 ? [`Showing last ${recentMessages.length} messages (${hiddenCount} earlier hidden)`, ''] : ['']),
  ];
  for (const message of recentMessages) {
    lines.push(`[${message.role}] ${message.text}`);
  }
  return lines.join('\n');
}

export function formatSessionOverview(session: SessionRecord): string {
  const counts = {
    system: session.messages.filter((message) => message.role === 'system').length,
    user: session.messages.filter((message) => message.role === 'user').length,
    assistant: session.messages.filter((message) => message.role === 'assistant').length,
  };

  const lastMessage = session.messages.at(-1);
  return [
    `Session: ${session.title}`,
    `ID: ${session.id}`,
    `Created: ${session.createdAt}`,
    `Updated: ${session.updatedAt}`,
    `Messages: ${session.messages.length}`,
    `Role counts: system=${counts.system} user=${counts.user} assistant=${counts.assistant}`,
    `Last message: ${lastMessage ? `[${lastMessage.role}] ${lastMessage.text}` : 'n/a'}`,
  ].join('\n');
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

export function formatRecallScoringExplanation(scoring: RecallScoringConfig): string {
  return [
    'Recall scoring profile',
    '',
    `Session salience multiplier: ${scoring.sessionSalienceMultiplier} (higher means important session messages outrank shallow lexical matches more often)`,
    `Duplicate semantic priority bonus: ${scoring.duplicateSemanticPriorityBonus} (higher means curated semantic memory wins more often when text duplicates session memory)`,
    `Diversity penalty per bucket hit: ${scoring.diversityPenaltyPerBucketHit} (higher means top recall results are spread across stores/sessions more aggressively)`,
    '',
    'Session recency profile',
    `- within 1 day: ${scoring.sessionRecency.within1Day}`,
    `- within 7 days: ${scoring.sessionRecency.within7Days}`,
    `- within 30 days: ${scoring.sessionRecency.within30Days}`,
    `- within 90 days: ${scoring.sessionRecency.within90Days}`,
    `- older: ${scoring.sessionRecency.older}`,
    '',
    'Semantic recency profile',
    `- within 1 day: ${scoring.semanticRecency.within1Day}`,
    `- within 7 days: ${scoring.semanticRecency.within7Days}`,
    `- within 30 days: ${scoring.semanticRecency.within30Days}`,
    `- within 180 days: ${scoring.semanticRecency.within180Days}`,
    `- older: ${scoring.semanticRecency.older}`,
    '',
    'Interpretation',
    '- positive recency values boost newer memory',
    '- negative recency values decay older memory',
    '- session memory is meant to fade faster than curated semantic memory',
  ].join('\n');
}
