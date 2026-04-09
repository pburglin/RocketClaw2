import { addSemanticMemory } from './semantic-store.js';
import type { ConsolidationCandidate } from './consolidation.js';

export async function rememberCandidate(candidate: ConsolidationCandidate): Promise<void> {
  await addSemanticMemory({
    text: candidate.text,
    sourceSessionId: candidate.sessionId,
    sourceMessageId: candidate.messageId,
    salience: candidate.salience,
    tags: [candidate.role, candidate.suggestedAction],
  });
}
