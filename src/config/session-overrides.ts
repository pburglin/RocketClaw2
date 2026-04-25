import type { AppConfig } from './load-config.js';
import { mergeLlmOverrides } from './llm.js';

export function applySessionOverrides(
  config: AppConfig,
  overrides: { llmBaseUrl?: string; llmApiKey?: string; llmModel?: string; llmRetryCount?: number },
): AppConfig {
  return {
    ...config,
    llm: mergeLlmOverrides(config.llm, {
      baseUrl: overrides.llmBaseUrl,
      apiKey: overrides.llmApiKey,
      model: overrides.llmModel,
      retryCount: overrides.llmRetryCount,
    }),
  };
}
