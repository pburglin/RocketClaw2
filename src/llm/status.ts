import type { AppConfig } from '../config/load-config.js';

export function buildLlmStatus(config: AppConfig, hasSessionOverrides: boolean) {
  return {
    baseUrl: config.llm.baseUrl,
    model: config.llm.model,
    retryCount: config.llm.retryCount,
    apiKeyConfigured: Boolean(config.llm.apiKey),
    sessionOverridesActive: hasSessionOverrides,
    readyForQuery: Boolean(config.llm.apiKey && config.llm.baseUrl && config.llm.model),
  };
}

export function formatLlmStatus(status: ReturnType<typeof buildLlmStatus>): string {
  return [
    'LLM Status',
    `Base URL: ${status.baseUrl}`,
    `Model: ${status.model}`,
    `Server-error retry count: ${status.retryCount}`,
    `API key configured: ${status.apiKeyConfigured ? 'yes' : 'no'}`,
    `Session overrides active: ${status.sessionOverridesActive ? 'yes' : 'no'}`,
    `Ready for query: ${status.readyForQuery ? 'yes' : 'no'}`,
  ].join('\n');
}
