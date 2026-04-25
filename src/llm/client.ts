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
  stream?: boolean;
  onToken?: (chunk: string) => void;
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

function extractStreamDelta(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const record = payload as Record<string, unknown>;

  const direct = extractText(record.output_text);
  if (direct) return direct;

  const choices = record.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const first = choices[0] as Record<string, unknown>;
    const deltaText = extractText(first.delta) || extractText(first.message) || extractText(first.text);
    if (deltaText) return deltaText;
  }

  return extractText(record.delta) || extractText(record.output) || extractText(record.message);
}

async function readStreamedCompletion(
  response: Response,
  options: RunLlmQueryOptions,
): Promise<{ content: string; responseBody: unknown }> {
  const reader = response.body?.getReader();
  if (!reader) {
    const payload = await response.json();
    return { content: extractCompletionText(payload).trim(), responseBody: payload };
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let eventCount = 0;
  let lastPayload: unknown = null;

  const handleEvent = (rawEvent: string) => {
    const data = rawEvent
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n')
      .trim();

    if (!data || data === '[DONE]') return;

    const payload = JSON.parse(data);
    lastPayload = payload;
    eventCount += 1;

    const payloadError = explainPayloadError(payload);
    if (payloadError) {
      throw new Error(payloadError);
    }

    const delta = extractStreamDelta(payload);
    if (delta) {
      content += delta;
      options.onToken?.(delta);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    let boundaryIndex = buffer.search(/\r?\n\r?\n/);
    while (boundaryIndex !== -1) {
      const rawEvent = buffer.slice(0, boundaryIndex);
      const separatorMatch = buffer.slice(boundaryIndex).match(/^\r?\n\r?\n/);
      const separatorLength = separatorMatch ? separatorMatch[0].length : 2;
      buffer = buffer.slice(boundaryIndex + separatorLength);
      handleEvent(rawEvent);
      boundaryIndex = buffer.search(/\r?\n\r?\n/);
    }

    if (done) break;
  }

  if (buffer.trim()) {
    handleEvent(buffer);
  }

  return {
    content: content.trim(),
    responseBody: { streamed: true, eventCount, lastPayload },
  };
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
  const shouldStream = Boolean(options.stream);
  const requestBody = {
    model: config.llm.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    ...(shouldStream ? { stream: true } : {}),
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

    const contentType = response.headers?.get?.('content-type') ?? '';
    const streamedResponse = shouldStream && contentType.includes('text/event-stream');
    const { content, responseBody } = streamedResponse
      ? await readStreamedCompletion(response, options)
      : await (async () => {
          const payload = await response.json();
          return { content: extractCompletionText(payload).trim(), responseBody: payload };
        })();

    recordLlmResponse(channel, Date.now() - start);

    const payloadError = explainPayloadError(responseBody);
    if (payloadError) {
      const payloadErrorInfo = getPayloadErrorInfo(responseBody);
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
        responseBody,
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
          responseBody,
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

    options.onTrace?.({
      phase: 'response',
      channel,
      endpoint,
      model: config.llm.model,
      label: options.label,
      requestBody,
      responseStatus: response.status,
      responseBody,
      extractedText: content,
      attempt,
      maxRetries,
    });
    if (!content) {
      const preview = JSON.stringify(responseBody).slice(0, 400);
      const err = new Error(`LLM query returned no message content. Response preview: ${preview}`);
      recordLlmError(channel, err.message);
      throw err;
    }

    return content;
  }
}
