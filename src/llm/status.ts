import type { AppConfig } from '../config/load-config.js';

export function buildLlmStatus(config: AppConfig, hasSessionOverrides: boolean) {
  const mockMode = config.llm.mode === 'mock';
  return {
    mode: config.llm.mode,
    baseUrl: config.llm.baseUrl,
    model: config.llm.model,
    retryCount: config.llm.retryCount,
    apiKeyConfigured: Boolean(config.llm.apiKey),
    sessionOverridesActive: hasSessionOverrides,
    readyForQuery: mockMode || Boolean(config.llm.apiKey && config.llm.baseUrl && config.llm.model),
  };
}

export function formatLlmStatus(status: ReturnType<typeof buildLlmStatus>): string {
  return [
    'LLM Status',
    `Mode: ${status.mode}`,
    `Base URL: ${status.baseUrl}`,
    `Model: ${status.model}`,
    `Server-error retry count: ${status.retryCount}`,
    `API key configured: ${status.apiKeyConfigured ? 'yes' : 'no'}`,
    `Session overrides active: ${status.sessionOverridesActive ? 'yes' : 'no'}`,
    `Ready for query: ${status.readyForQuery ? 'yes' : 'no'}`,
  ].join('\n');
}
