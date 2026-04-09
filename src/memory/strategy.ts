export type MemoryStrategy = {
  principles: string[];
  tiers: Array<{ name: string; purpose: string }>;
  dreamingLoop: string[];
};

export function getMemoryStrategy(): MemoryStrategy {
  return {
    principles: [
      'Separate ephemeral session context from persistent curated memory.',
      'Prefer summarization and compaction over raw accumulation.',
      'Promote only durable facts, decisions, preferences, and active commitments.',
    ],
    tiers: [
      { name: 'working-memory', purpose: 'short-lived session context and current tasks' },
      { name: 'episodic-memory', purpose: 'daily logs and recent events for replay or summarization' },
      { name: 'semantic-memory', purpose: 'curated durable knowledge, preferences, and distilled facts' },
    ],
    dreamingLoop: [
      'collect recent episodic entries',
      'cluster and summarize repeated patterns',
      'promote durable insights into semantic memory',
      'prune or compress stale low-value details',
      'refresh retrieval indexes and salience scores',
    ],
  };
}
