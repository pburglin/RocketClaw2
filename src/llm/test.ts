import type { AppConfig } from '../config/load-config.js';
import { runLlmQuery } from './client.js';

export async function runLlmTest(config: AppConfig): Promise<{ ok: boolean; model: string; baseUrl: string; response: string }> {
  const response = await runLlmQuery(config, 'Reply with exactly: LLM_OK');
  return {
    ok: response.includes('LLM_OK'),
    model: config.llm.model,
    baseUrl: config.llm.baseUrl,
    response,
  };
}
