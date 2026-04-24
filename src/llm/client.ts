import type { AppConfig } from '../config/load-config.js';
import { explainLlmError } from './errors.js';
import { recordLlmRequest, recordLlmResponse, recordLlmError } from '../telemetry/runtime.js';

function extractText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';

  if (Array.isArray(value)) {
    return value.map((part) => extractText(part)).filter(Boolean).join('\n').trim();
  }

  const record = value as Record<string, unknown>;

  if (typeof record.text === 'string') return record.text;
  if (record.text && typeof record.text === 'object') {
    const nested = record.text as Record<string, unknown>;
    if (typeof nested.value === 'string') return nested.value;
  }

  if (typeof record.output_text === 'string') return record.output_text;
  if (typeof record.content === 'string') return record.content;
  if (record.content) return extractText(record.content);
  if (record.message) return extractText(record.message);
  if (record.output) return extractText(record.output);

  return '';
}

function extractCompletionText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const record = payload as Record<string, unknown>;

  const direct = extractText(record.output_text);
  if (direct) return direct;

  const choices = record.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const first = choices[0] as Record<string, unknown>;
    const choiceText = extractText(first.message) || extractText(first.delta) || extractText(first.text);
    if (choiceText) return choiceText;
  }

  return extractText(record.output) || extractText(record.message);
}

export async function runLlmQuery(config: AppConfig, prompt: string, channel = 'cli'): Promise<string> {
  if (!config.llm.apiKey) {
    throw new Error('No LLM API key configured. Set llm.apiKey in config.yaml or pass --llm-api-key for this session.');
  }

  recordLlmRequest(channel);
  const start = Date.now();

  const response = await fetch(`${config.llm.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.llm.apiKey}`,
    },
    body: JSON.stringify({
      model: config.llm.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(explainLlmError(response.status, text));
    recordLlmError(channel, err.message);
    throw err;
  }

  recordLlmResponse(channel, Date.now() - start);

  const payload = await response.json();
  const content = extractCompletionText(payload).trim();
  if (!content) {
    const preview = JSON.stringify(payload).slice(0, 400);
    throw new Error(`LLM query returned no message content. Response preview: ${preview}`);
  }

  return content;
}
