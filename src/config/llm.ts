import { z } from 'zod';

export const LlmConfigSchema = z.object({
  baseUrl: z.string().url().default('https://api.openai.com/v1'),
  apiKey: z.string().optional(),
  model: z.string().default('gpt-4o-mini'),
  retryCount: z.number().int().min(0).default(3),
});

export type LlmConfig = z.infer<typeof LlmConfigSchema>;

export function mergeLlmOverrides(
  base: LlmConfig,
  overrides: { baseUrl?: string; apiKey?: string; model?: string; retryCount?: number },
): LlmConfig {
  return {
    ...base,
    ...(overrides.baseUrl ? { baseUrl: overrides.baseUrl } : {}),
    ...(overrides.apiKey ? { apiKey: overrides.apiKey } : {}),
    ...(overrides.model ? { model: overrides.model } : {}),
    ...(overrides.retryCount !== undefined ? { retryCount: overrides.retryCount } : {}),
  };
}
