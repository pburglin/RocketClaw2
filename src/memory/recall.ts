import { getDefaultProjectRoot } from '../config/app-paths.js';
import { loadConfig, loadConfigFromDisk, type RecallScoringConfig } from '../config/load-config.js';
import { searchSessionMemory, scoreTextMatch } from './retrieval.js';
import { loadSemanticMemory } from './semantic-store.js';
import { scoreMessageSalience } from './salience.js';

export type RecallHit =
  | {
      kind: 'session';
      sessionId: string;
      sessionTitle: string;
      messageId: string;
      role: 'system' | 'user' | 'assistant';
      text: string;
      createdAt: string;
      score: number;
    }
  | {
      kind: 'semantic';
      id: string;
      text: string;
      createdAt: string;
      salience: number;
      score: number;
      tags: string[];
    };

type SemanticRecallHit = Extract<RecallHit, { kind: 'semantic' }>;

type RecallMemoryKind = 'session' | 'semantic';

const defaultRecallScoring = loadConfig({}).recallScoring;

function getRecencyAdjustment(createdAt: string, kind: RecallMemoryKind, scoring: RecallScoringConfig): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) return 0;

  const ageHours = ageMs / (1000 * 60 * 60);

  if (kind === 'session') {
    if (ageHours <= 24) return scoring.sessionRecency.within1Day;
    if (ageHours <= 24 * 7) return scoring.sessionRecency.within7Days;
    if (ageHours <= 24 * 30) return scoring.sessionRecency.within30Days;
    if (ageHours <= 24 * 90) return scoring.sessionRecency.within90Days;
    return scoring.sessionRecency.older;
  }

  if (ageHours <= 24) return scoring.semanticRecency.within1Day;
  if (ageHours <= 24 * 7) return scoring.semanticRecency.within7Days;
  if (ageHours <= 24 * 30) return scoring.semanticRecency.within30Days;
  if (ageHours <= 24 * 180) return scoring.semanticRecency.within180Days;
  return scoring.semanticRecency.older;
}

function normalizeRecallText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function dedupeRecallHits(hits: RecallHit[], scoring: RecallScoringConfig): RecallHit[] {
  const bestByText = new Map<string, RecallHit>();

  for (const hit of hits) {
    const key = normalizeRecallText(hit.text);
    const existing = bestByText.get(key);
    if (!existing) {
      bestByText.set(key, hit);
      continue;
    }

    const existingPriority = existing.kind === 'semantic' ? 1 : 0;
    const currentPriority = hit.kind === 'semantic' ? 1 : 0;
    const existingComparisonScore = existing.score + existingPriority * scoring.duplicateSemanticPriorityBonus;
    const currentComparisonScore = hit.score + currentPriority * scoring.duplicateSemanticPriorityBonus;
    const shouldReplace =
      currentComparisonScore > existingComparisonScore ||
      (currentComparisonScore === existingComparisonScore && hit.createdAt > existing.createdAt);

    if (shouldReplace) {
      bestByText.set(key, hit);
    }
  }

  return [...bestByText.values()].sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt));
}

function getDiversityBucket(hit: RecallHit): string {
  if (hit.kind === 'semantic') return 'semantic';
  return `session:${hit.sessionId}`;
}

function diversifyRecallHits(hits: RecallHit[], scoring: RecallScoringConfig): RecallHit[] {
  const sorted = [...hits].sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt));
  const bucketCounts = new Map<string, number>();

  return sorted
    .map((hit) => {
      const bucket = getDiversityBucket(hit);
      const seen = bucketCounts.get(bucket) ?? 0;
      bucketCounts.set(bucket, seen + 1);
      const adjustedScore = hit.score - seen * scoring.diversityPenaltyPerBucketHit;
      return { hit, adjustedScore };
    })
    .sort((a, b) => b.adjustedScore - a.adjustedScore || b.hit.score - a.hit.score || b.hit.createdAt.localeCompare(a.hit.createdAt))
    .map(({ hit }) => hit);
}

export async function recallMemory(
  query: string,
  root = getDefaultProjectRoot(),
  scoring?: RecallScoringConfig,
): Promise<RecallHit[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const resolvedScoring = scoring ?? (await loadConfigFromDisk(root)).recallScoring ?? defaultRecallScoring;

  const sessionHits = await searchSessionMemory(query, root);
  const semanticEntries = await loadSemanticMemory(root);
  const semanticCandidates: Array<SemanticRecallHit | null> = semanticEntries.map((entry) => {
    const textScore = scoreTextMatch(q, entry.text);
    const bestTagScore = Math.max(0, ...entry.tags.map((tag) => scoreTextMatch(q, tag)));
    const matchScore = Math.max(textScore, bestTagScore);
    if (matchScore <= 0) return null;
    return {
      kind: 'semantic' as const,
      id: entry.id,
      text: entry.text,
      createdAt: entry.createdAt,
      salience: entry.salience,
      score: entry.salience + 20 + matchScore + getRecencyAdjustment(entry.createdAt, 'semantic', resolvedScoring),
      tags: entry.tags,
    };
  });
  const semanticHits: SemanticRecallHit[] = semanticCandidates.filter(
    (entry): entry is SemanticRecallHit => entry !== null,
  );

  const normalizedSessionHits: RecallHit[] = sessionHits.map((hit) => {
    const salience = scoreMessageSalience({
      id: hit.messageId,
      role: hit.role,
      text: hit.text,
      createdAt: hit.createdAt,
    });

    return {
      kind: 'session' as const,
      sessionId: hit.sessionId,
      sessionTitle: hit.sessionTitle,
      messageId: hit.messageId,
      role: hit.role,
      text: hit.text,
      createdAt: hit.createdAt,
      score: hit.score + salience * resolvedScoring.sessionSalienceMultiplier + getRecencyAdjustment(hit.createdAt, 'session', resolvedScoring),
    };
  });

  return diversifyRecallHits(dedupeRecallHits([...semanticHits, ...normalizedSessionHits], resolvedScoring), resolvedScoring);
}
