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

function explainPayloadError(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const errorValue = record.error;
  if (!errorValue || typeof errorValue !== 'object' || Array.isArray(errorValue)) return null;

  const errorRecord = errorValue as Record<string, unknown>;
  const code = errorRecord.code;
  const message = typeof errorRecord.message === 'string' ? errorRecord.message : 'Provider returned an error payload.';
  const codeText = code === undefined || code === null ? '' : ` (code: ${String(code)})`;

  if (String(code) === '524') {
    return [
      `LLM provider timed out${codeText}.`,
      message,
      'This usually means the upstream provider/model did not finish in time.',
      'Recommended next steps:',
      '- verify the same base URL/model with `rocketclaw2 --llm-base-url "$BASE_URL" --llm-api-key "$API_KEY" --llm-model "$MODEL" llm-query --prompt "Reply with exactly: LLM_OK"`',
      '- retry with a faster/smaller known-good model such as `gpt-4o-mini`',
      '- if this is a gateway/provider shim, check its upstream timeout limits',
    ].join('\n');
  }

  return `LLM provider returned an error payload${codeText}. ${message}`;
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
  const payloadError = explainPayloadError(payload);
  if (payloadError) {
    const err = new Error(payloadError);
    recordLlmError(channel, err.message);
    throw err;
  }

  const content = extractCompletionText(payload).trim();
  if (!content) {
    const preview = JSON.stringify(payload).slice(0, 400);
    const err = new Error(`LLM query returned no message content. Response preview: ${preview}`);
    recordLlmError(channel, err.message);
    throw err;
  }

  return content;
}
