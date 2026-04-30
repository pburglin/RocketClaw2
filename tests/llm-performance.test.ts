import { describe, expect, it } from 'vitest';
import { computeLlmPerformanceStatsFromEvents } from '../src/telemetry/store.js';
import type { TelemetryEvent } from '../src/telemetry/schema.js';

describe('LLM performance stats', () => {
  it('aggregates success/error, timing, and token metrics for a session', () => {
    const events: TelemetryEvent[] = [
      {
        id: '1',
        timestamp: '2026-04-25T22:00:00.000Z',
        sessionId: 'session-123',
        channel: 'cli',
        eventType: 'llm_request',
        ok: true,
      },
      {
        id: '2',
        timestamp: '2026-04-25T22:00:02.000Z',
        sessionId: 'session-123',
        channel: 'cli',
        eventType: 'llm_response',
        durationMs: 2000,
        metadata: { promptTokens: 20, completionTokens: 40, totalTokens: 60, tokensPerSecond: 20 },
        ok: true,
      },
      {
        id: '3',
        timestamp: '2026-04-25T22:01:00.000Z',
        sessionId: 'session-123',
        channel: 'cli',
        eventType: 'llm_request',
        ok: true,
      },
      {
        id: '4',
        timestamp: '2026-04-25T22:01:03.000Z',
        sessionId: 'session-123',
        channel: 'cli',
        eventType: 'llm_response',
        durationMs: 3000,
        metadata: { promptTokens: 10, completionTokens: 30, totalTokens: 40, tokensPerSecond: 10, estimatedTokens: true },
        ok: true,
      },
      {
        id: '5',
        timestamp: '2026-04-25T22:02:00.000Z',
        sessionId: 'session-123',
        channel: 'cli',
        eventType: 'llm_error',
        error: 'provider timeout',
        ok: false,
      },
    ];

    const stats = computeLlmPerformanceStatsFromEvents(events, {
      sessionId: 'session-123',
      periodStart: '2026-04-25T21:59:00.000Z',
      periodEnd: '2026-04-25T22:03:00.000Z',
    });

    expect(stats.requestCount).toBe(2);
    expect(stats.successCount).toBe(2);
    expect(stats.errorCount).toBe(1);
    expect(stats.successRate).toBe(1);
    expect(stats.avgResponseTimeMs).toBe(2500);
    expect(stats.avgCompletionTokensPerResponse).toBe(35);
    expect(stats.avgTotalTokensPerResponse).toBe(50);
    expect(stats.tokensPerSecond).toBe(14);
    expect(stats.totalPromptTokens).toBe(30);
    expect(stats.totalCompletionTokens).toBe(70);
    expect(stats.totalTokens).toBe(100);
    expect(stats.estimatedResponseCount).toBe(1);
  });
});
