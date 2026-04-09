import type { RecallHit } from './recall.js';

export function formatRecallHits(hits: RecallHit[]): string {
  if (hits.length === 0) return 'No recall hits found.';
  return hits
    .map((hit) => {
      if (hit.kind === 'semantic') {
        return `semantic | score=${hit.score} | salience=${hit.salience} | ${hit.text}`;
      }
      return `session | score=${hit.score} | ${hit.sessionTitle} | [${hit.role}] ${hit.text}`;
    })
    .join('\n');
}

export function formatRecallSummary(hits: RecallHit[]): string {
  const semantic = hits.filter((hit) => hit.kind === 'semantic').length;
  const session = hits.filter((hit) => hit.kind === 'session').length;
  const topScore = hits[0]?.score ?? 0;
  return [
    `Total hits: ${hits.length}`,
    `Semantic hits: ${semantic}`,
    `Session hits: ${session}`,
    `Top score: ${topScore}`,
  ].join('\n');
}
