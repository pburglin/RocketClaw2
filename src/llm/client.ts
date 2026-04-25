import type { AppConfig } from '../config/load-config.js';
import { explainLlmError } from './errors.js';
import { recordLlmRequest, recordLlmResponse, recordLlmError } from '../telemetry/runtime.js';

export type LlmTraceEvent = {
  phase: 'request' | 'response' | 'error' | 'retry';
  channel: string;
  endpoint: string;
  model: string;
  label?: string;
  requestBody?: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: unknown;
  extractedText?: string;
  error?: string;
  attempt?: number;
  maxRetries?: number;
  backoffMs?: number;
};

export type RunLlmQueryOptions = {
  channel?: string;
  label?: string;
  onTrace?: (event: LlmTraceEvent) => void;
  retryCount?: number;
};

const MAX_RETRY_BACKOFF_MS = 5 * 60 * 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function getPayloadErrorInfo(payload: unknown): { message: string; code?: string } | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const errorValue = record.error;
  if (!errorValue || typeof errorValue !== 'object' || Array.isArray(errorValue)) return null;

  const errorRecord = errorValue as Record<string, unknown>;
  const code = errorRecord.code;
  return {
    message: typeof errorRecord.message === 'string' ? errorRecord.message : 'Provider returned an error payload.',
    code: code === undefined || code === null ? undefined : String(code),
  };
}

function explainPayloadError(payload: unknown): string | null {
  const errorInfo = getPayloadErrorInfo(payload);
  if (!errorInfo) return null;
  const codeText = errorInfo.code ? ` (code: ${errorInfo.code})` : '';

  if (errorInfo.code === '524') {
    return [
      `LLM provider timed out${codeText}.`,
      errorInfo.message,
      'This usually means the upstream provider/model did not finish in time.',
      'Recommended next steps:',
      '- verify the same base URL/model with `rocketclaw2 --llm-base-url "$BASE_URL" --llm-api-key "$API_KEY" --llm-model "$MODEL" llm-query --prompt "Reply with exactly: LLM_OK"`',
      '- retry with a faster/smaller known-good model such as `gpt-4o-mini`',
      '- if this is a gateway/provider shim, check its upstream timeout limits',
    ].join('\n');
  }

  return `LLM provider returned an error payload${codeText}. ${errorInfo.message}`;
}

function isRetriableServerStatus(status: number): boolean {
  return status >= 500 && status < 600;
}

function isRetriablePayloadCode(code?: string): boolean {
  if (!code) return false;
  const numeric = Number(code);
  return Number.isFinite(numeric) && numeric >= 500 && numeric < 600;
}

function getRetryBackoffMs(attempt: number): number {
  return Math.min(MAX_RETRY_BACKOFF_MS, 1000 * (2 ** Math.max(0, attempt - 1)));
}

export async function runLlmQuery(config: AppConfig, prompt: string, channelOrOptions: string | RunLlmQueryOptions = 'cli'): Promise<string> {
  if (!config.llm.apiKey) {
    throw new Error('No LLM API key configured. Set llm.apiKey in config.yaml or pass --llm-api-key for this session.');
  }

  const options = typeof channelOrOptions === 'string'
    ? { channel: channelOrOptions }
    : channelOrOptions;
  const channel = options.channel ?? 'cli';
  const maxRetries = options.retryCount ?? config.llm.retryCount ?? 3;
  const endpoint = `${config.llm.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const requestBody = {
    model: config.llm.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  } satisfies Record<string, unknown>;

  for (let attempt = 1; ; attempt += 1) {
    recordLlmRequest(channel);
    options.onTrace?.({
      phase: 'request',
      channel,
      endpoint,
      model: config.llm.model,
      label: options.label,
      requestBody,
      attempt,
      maxRetries,
    });
    const start = Date.now();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.llm.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const text = await response.text();
      const err = new Error(explainLlmError(response.status, text));
      const shouldRetry = isRetriableServerStatus(response.status) && attempt <= maxRetries;
      options.onTrace?.({
        phase: 'error',
        channel,
        endpoint,
        model: config.llm.model,
        label: options.label,
        requestBody,
        responseStatus: response.status,
        responseBody: text,
        error: err.message,
        attempt,
        maxRetries,
      });
      if (shouldRetry) {
        const backoffMs = getRetryBackoffMs(attempt);
        options.onTrace?.({
          phase: 'retry',
          channel,
          endpoint,
          model: config.llm.model,
          label: options.label,
          error: err.message,
          responseStatus: response.status,
          attempt,
          maxRetries,
          backoffMs,
        });
        await sleep(backoffMs);
        continue;
      }
      recordLlmError(channel, err.message);
      throw err;
    }

    recordLlmResponse(channel, Date.now() - start);

    const payload = await response.json();
    const payloadError = explainPayloadError(payload);
    if (payloadError) {
      const payloadErrorInfo = getPayloadErrorInfo(payload);
      const err = new Error(payloadError);
      const shouldRetry = isRetriablePayloadCode(payloadErrorInfo?.code) && attempt <= maxRetries;
      options.onTrace?.({
        phase: 'error',
        channel,
        endpoint,
        model: config.llm.model,
        label: options.label,
        requestBody,
        responseStatus: response.status,
        responseBody: payload,
        error: err.message,
        attempt,
        maxRetries,
      });
      if (shouldRetry) {
        const backoffMs = getRetryBackoffMs(attempt);
        options.onTrace?.({
          phase: 'retry',
          channel,
          endpoint,
          model: config.llm.model,
          label: options.label,
          error: err.message,
          responseStatus: response.status,
          responseBody: payload,
          attempt,
          maxRetries,
          backoffMs,
        });
        await sleep(backoffMs);
        continue;
      }
      recordLlmError(channel, err.message);
      throw err;
    }

    const content = extractCompletionText(payload).trim();
    options.onTrace?.({
      phase: 'response',
      channel,
      endpoint,
      model: config.llm.model,
      label: options.label,
      requestBody,
      responseStatus: response.status,
      responseBody: payload,
      extractedText: content,
      attempt,
      maxRetries,
    });
    if (!content) {
      const preview = JSON.stringify(payload).slice(0, 400);
      const err = new Error(`LLM query returned no message content. Response preview: ${preview}`);
      recordLlmError(channel, err.message);
      throw err;
    }

    return content;
  }
}
