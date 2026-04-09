import fs from 'node:fs/promises';
import YAML from 'yaml';
import { z } from 'zod';
import { getConfigPath, getDefaultProjectRoot } from './app-paths.js';
import { ToolPolicySchema, buildDefaultToolPolicies } from '../tools/policy.js';
import { MessagingConfigSchema } from '../messaging/config.js';
import { YoloConfigSchema } from './yolo.js';

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
