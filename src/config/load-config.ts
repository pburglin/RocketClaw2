import fs from 'node:fs/promises';
import YAML from 'yaml';
import { z } from 'zod';
import { getConfigPath, getDefaultProjectRoot } from './app-paths.js';
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
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(getConfigPath(root), YAML.stringify(config));
}

export function listRecallScoringPaths(): string[] {
  return [
    'sessionSalienceMultiplier',
    'duplicateSemanticPriorityBonus',
    'diversityPenaltyPerBucketHit',
    'sessionRecency.within1Day',
    'sessionRecency.within7Days',
    'sessionRecency.within30Days',
    'sessionRecency.within90Days',
    'sessionRecency.older',
    'semanticRecency.within1Day',
    'semanticRecency.within7Days',
    'semanticRecency.within30Days',
    'semanticRecency.within180Days',
    'semanticRecency.older',
  ];
}

function buildUnknownRecallPathError(path: string): Error {
  return new Error(`Unknown recall scoring path: ${path}. Valid paths: ${listRecallScoringPaths().join(', ')}`);
}

export async function setRecallScoringValue(
  path: string,
  value: number,
  root = getDefaultProjectRoot(),
): Promise<AppConfig> {
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
