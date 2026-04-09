import { listSessions } from '../sessions/store.js';
import { scoreMessageSalience } from './salience.js';
import { getDefaultProjectRoot } from '../config/app-paths.js';

export type ConsolidationCandidate = {
  sessionId: string;
  sessionTitle: string;
  messageId: string;
  text: string;
  role: 'system' | 'user' | 'assistant';
  salience: number;
  suggestedAction: 'promote' | 'summarize' | 'ignore';
};

export async function buildConsolidationPlan(root = getDefaultProjectRoot()): Promise<ConsolidationCandidate[]> {
  const sessions = await listSessions(root);
  const candidates: ConsolidationCandidate[] = [];

  for (const session of sessions) {
    for (const message of session.messages) {
      const salience = scoreMessageSalience(message);
      const suggestedAction = salience >= 30 ? 'promote' : salience >= 15 ? 'summarize' : 'ignore';
      if (suggestedAction === 'ignore') continue;
      candidates.push({
        sessionId: session.id,
        sessionTitle: session.title,
        messageId: message.id,
        text: message.text,
        role: message.role,
        salience,
        suggestedAction,
      });
    }
  }

  return candidates.sort((a, b) => b.salience - a.salience);
}
