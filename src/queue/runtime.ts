import type { AppConfig } from '../config/load-config.js';
import { enqueueRequest, markProcessing, markDone, markFailed, peekQueue } from './store.js';
import { recordRateLimit, recordQueueJoined, recordQueueProcessed } from '../telemetry/runtime.js';
import { runLlmQuery } from '../llm/client.js';

export type QueueContext = {
  channel: string;
  sender?: string;
  sessionId?: string;
};

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('429') || msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('quota');
  }
  return false;
}

export async function runWithQueue(
  config: AppConfig,
  context: QueueContext,
  text: string,
  maxRetries = 2,
): Promise<{ ok: boolean; result?: string; queued?: boolean; error?: string }> {
  let lastError: string = '';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await runLlmQuery(config, text, { channel: context.channel, sessionId: context.sessionId });
      return { ok: true, result };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      lastError = errorMsg;

      if (isRateLimitError(err)) {
        if (attempt < maxRetries) {
          // Exponential backoff: 2s, 4s, 8s...
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
          continue;
        }
        // All retries exhausted — queue the request
        recordRateLimit(context.channel, context.sessionId);
        const item = await enqueueRequest({
          channel: context.channel,
          sender: context.sender,
          message: text,
          metadata: { sessionId: context.sessionId, attempt, originalError: errorMsg },
        });
        recordQueueJoined(context.channel, context.sessionId);
        return { ok: false, queued: true, error: `Rate limited. Request queued (position ${item.id.slice(0, 8)}). We'll process it shortly.` };
      }

      // Non-rate-limit error
      return { ok: false, error: errorMsg };
    }
  }

  return { ok: false, error: lastError };
}

export async function processQueue(config: AppConfig, limit = 10): Promise<{ processed: number; failed: number }> {
  const pending = await peekQueue(limit);
  let processed = 0;
  let failed = 0;

  for (const item of pending) {
    await markProcessing(item.id);
    try {
      const start = Date.now();
      const result = await runLlmQuery(config, item.message, {
        channel: item.channel,
        sessionId: item.metadata?.sessionId as string | undefined,
      });
      await markDone(item.id, result);
      recordQueueProcessed(item.channel, Date.now() - start, true, item.metadata?.sessionId as string | undefined);
      processed++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await markFailed(item.id, errorMsg);
      recordQueueProcessed(item.channel, 0, false, item.metadata?.sessionId as string | undefined);
      failed++;
    }
  }

  return { processed, failed };
}
