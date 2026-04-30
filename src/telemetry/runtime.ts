import { recordEvent } from './store.js';

export async function recordCommandInvoked(channel: string, command: string, sessionId?: string): Promise<void> {
  await recordEvent({ channel, eventType: 'command_invoked', command, sessionId, ok: true });
}

export async function recordCommandCompleted(channel: string, command: string, durationMs: number, sessionId?: string): Promise<void> {
  await recordEvent({ channel, eventType: 'command_completed', command, durationMs, sessionId, ok: true });
}

export async function recordCommandError(channel: string, command: string, error: string, durationMs?: number, sessionId?: string): Promise<void> {
  await recordEvent({ channel, eventType: 'command_error', command, error, durationMs, sessionId, ok: false });
}

export async function recordLlmRequest(channel: string, sessionId?: string): Promise<void> {
  await recordEvent({ channel, eventType: 'llm_request', sessionId, ok: true });
}

export async function recordLlmResponse(channel: string, durationMs: number, sessionId?: string, metadata?: Record<string, unknown>): Promise<void> {
  await recordEvent({ channel, eventType: 'llm_response', durationMs, sessionId, metadata, ok: true });
}

export async function recordLlmError(channel: string, error: string, sessionId?: string, metadata?: Record<string, unknown>): Promise<void> {
  await recordEvent({ channel, eventType: 'llm_error', error, sessionId, metadata, ok: false });
}

export async function recordRateLimit(channel: string, sessionId?: string): Promise<void> {
  await recordEvent({ channel, eventType: 'rate_limited', sessionId, ok: false });
}

export async function recordQueueJoined(channel: string, sessionId?: string): Promise<void> {
  await recordEvent({ channel, eventType: 'queue_joined', sessionId, ok: true });
}

export async function recordQueueProcessed(channel: string, durationMs: number, ok: boolean, sessionId?: string): Promise<void> {
  await recordEvent({ channel, eventType: 'queue_processed', durationMs, sessionId, ok });
}
