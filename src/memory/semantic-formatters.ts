import type { SemanticMemoryEntry } from './semantic-store.js';

export function formatSemanticMemorySummary(entries: SemanticMemoryEntry[]): string {
  const total = entries.length;
  const topSalience = entries.reduce((max, entry) => Math.max(max, entry.salience), 0);
  const tagCounts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => `${tag}:${count}`)
    .join(', ');

  return [
    `Semantic entries: ${total}`,
    `Top salience: ${topSalience}`,
    `Top tags: ${topTags || 'n/a'}`,
  ].join('\n');
}

export function formatSemanticMemoryFiltered(entries: SemanticMemoryEntry[]): string {
  if (entries.length === 0) return 'No semantic memory entries found.';
  return entries
    .map((entry) => `${entry.id} | salience=${entry.salience} | tags=${entry.tags.join(',')} | ${entry.text}`)
    .join('\n');
}
