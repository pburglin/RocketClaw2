import fs from 'node:fs/promises';
import YAML from 'yaml';
import { z } from 'zod';
import { getConfigPath, getDefaultProjectRoot } from './app-paths.js';
import { writeConfigFile } from './write-config.js';
import { ToolPolicySchema, buildDefaultToolPolicies } from '../tools/policy.js';
import { MessagingConfigSchema } from '../messaging/config.js';
import { YoloConfigSchema } from './yolo.js';
import { LlmConfigSchema } from './llm.js';

export const RecallScoringConfigSchema = z.object({
  sessionSalienceMultiplier: z.number().default(3),
  duplicateSemanticPriorityBonus: z.number().default(100),
  diversityPenaltyPerBucketHit: z.number().default(15),
  sessionRecency: z.object({
    within1Day: z.number().default(18),
    within7Days: z.number().default(10),
    within30Days: z.number().default(0),
    within90Days: z.number().default(-10),
    older: z.number().default(-20),
  }).default({}),
  semanticRecency: z.object({
    within1Day: z.number().default(8),
    within7Days: z.number().default(5),
    within30Days: z.number().default(0),
    within180Days: z.number().default(-3),
    older: z.number().default(-6),
  }).default({}),
}).default({});

export const AppConfigSchema = z.object({
  profile: z.string().default('default'),
  messaging: MessagingConfigSchema.default({ whatsapp: { enabled: true, mode: 'mock' } }),
  yolo: YoloConfigSchema.default({ enabled: false, warn: true }),
  llm: LlmConfigSchema.default({ baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' }),
  tools: z.array(ToolPolicySchema).default(buildDefaultToolPolicies()),
  recallScoring: RecallScoringConfigSchema.default({}),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type RecallScoringConfig = z.infer<typeof RecallScoringConfigSchema>;

export function loadConfig(input: unknown = {}): AppConfig {
  return AppConfigSchema.parse(input);
}

export async function loadConfigFromDisk(root = getDefaultProjectRoot()): Promise<AppConfig> {
  try {
    const raw = await fs.readFile(getConfigPath(root), 'utf8');
    const parsed = YAML.parse(raw) ?? {};
    return loadConfig(parsed);
  } catch {
    return loadConfig({});
  }
}

export async function saveConfigToDisk(config: AppConfig, root = getDefaultProjectRoot()): Promise<void> {
  await writeConfigFile(config, root);
}

const RECALL_SCORING_RANGE_RULES: Record<string, { min: number; max: number }> = {
  sessionSalienceMultiplier: { min: 0, max: 10 },
  duplicateSemanticPriorityBonus: { min: 0, max: 500 },
  diversityPenaltyPerBucketHit: { min: 0, max: 100 },
  'sessionRecency.within1Day': { min: -100, max: 100 },
  'sessionRecency.within7Days': { min: -100, max: 100 },
  'sessionRecency.within30Days': { min: -100, max: 100 },
  'sessionRecency.within90Days': { min: -100, max: 100 },
  'sessionRecency.older': { min: -100, max: 100 },
  'semanticRecency.within1Day': { min: -100, max: 100 },
  'semanticRecency.within7Days': { min: -100, max: 100 },
  'semanticRecency.within30Days': { min: -100, max: 100 },
  'semanticRecency.within180Days': { min: -100, max: 100 },
  'semanticRecency.older': { min: -100, max: 100 },
};

export function listRecallScoringPaths(): string[] {
  return Object.keys(RECALL_SCORING_RANGE_RULES);
}

export function getRecallScoringRanges(): Record<string, { min: number; max: number }> {
  return structuredClone(RECALL_SCORING_RANGE_RULES);
}

export function getDefaultRecallScoringConfig(): RecallScoringConfig {
  return RecallScoringConfigSchema.parse({});
}

export interface RecallScoringField {
  current: number;
  default: number;
  delta: number;
}

export function buildRecallScoringDiff(
  root = getDefaultProjectRoot(),
): Promise<Record<string, RecallScoringField>> {
  return loadConfigFromDisk(root).then((config) => {
    const defaults = getDefaultRecallScoringConfig();
    const result: Record<string, RecallScoringField> = {};
    for (const p of listRecallScoringPaths()) {
      const segments = p.split('.').filter(Boolean);
      let cur: Record<string, unknown> = config.recallScoring as unknown as Record<string, unknown>;
      let def: Record<string, unknown> = defaults as unknown as Record<string, unknown>;
      for (let i = 0; i < segments.length - 1; i += 1) {
        cur = cur[segments[i]!] as Record<string, unknown>;
        def = def[segments[i]!] as Record<string, unknown>;
      }
      const leaf = segments[segments.length - 1]!;
      const current = (cur[leaf] as number) ?? 0;
      const defaultVal = (def[leaf] as number) ?? 0;
      result[p] = { current, default: defaultVal, delta: current - defaultVal };
    }
    return result;
  });
}

function buildUnknownRecallPathError(path: string): Error {
  return new Error(`Unknown recall scoring path: ${path}. Valid paths: ${listRecallScoringPaths().join(', ')}`);
}

function validateRecallScoringValue(path: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Recall scoring value must be a finite number for path: ${path}`);
  }
  const rule = RECALL_SCORING_RANGE_RULES[path];
  if (!rule) {
    throw buildUnknownRecallPathError(path);
  }
  if (value < rule.min || value > rule.max) {
    throw new Error(`Recall scoring value out of allowed range for ${path}: ${value}. Allowed range: ${rule.min} to ${rule.max}`);
  }
}

export async function setRecallScoringValue(
  path: string,
  value: number,
  root = getDefaultProjectRoot(),
): Promise<AppConfig> {
  validateRecallScoringValue(path, value);
  const config = await loadConfigFromDisk(root);
  const next = structuredClone(config) as AppConfig;
  const segments = path.split('.').filter(Boolean);
  if (segments.length === 0) throw new Error('Recall scoring path is required');

  let cursor: Record<string, unknown> = next.recallScoring as unknown as Record<string, unknown>;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const key = segments[i]!;
    const child = cursor[key];
    if (!child || typeof child !== 'object' || Array.isArray(child)) {
      throw buildUnknownRecallPathError(path);
    }
    cursor = child as Record<string, unknown>;
  }

  const leaf = segments[segments.length - 1]!;
  if (!(leaf in cursor)) {
    throw buildUnknownRecallPathError(path);
  }
  cursor[leaf] = value;

  const parsed = loadConfig(next);
  await saveConfigToDisk(parsed, root);
  return parsed;
}

export async function resetRecallScoring(
  paths?: string[],
  root = getDefaultProjectRoot(),
): Promise<AppConfig> {
  const defaults = getDefaultRecallScoringConfig();
  const config = await loadConfigFromDisk(root);
  const next = structuredClone(config) as AppConfig;

  const toReset = paths && paths.length > 0 ? paths : listRecallScoringPaths();

  for (const p of toReset) {
    if (!(p in RECALL_SCORING_RANGE_RULES)) {
      throw buildUnknownRecallPathError(p);
    }
  }

  for (const p of toReset) {
    const segments = p.split('.').filter(Boolean);
    let cursor: Record<string, unknown> = next.recallScoring as unknown as Record<string, unknown>;
    for (let i = 0; i < segments.length - 1; i += 1) {
      const key = segments[i]!;
      const child = cursor[key];
      if (!child || typeof child !== 'object' || Array.isArray(child)) {
        throw buildUnknownRecallPathError(p);
      }
      cursor = child as Record<string, unknown>;
    }
    const leaf = segments[segments.length - 1]!;
    let defaultCursor: Record<string, unknown> = defaults as unknown as Record<string, unknown>;
    for (const seg of segments) {
      defaultCursor = defaultCursor[seg] as Record<string, unknown>;
    }
    cursor[leaf] = defaultCursor;
  }

  const parsed = loadConfig(next);
  await saveConfigToDisk(parsed, root);
  return parsed;
}
