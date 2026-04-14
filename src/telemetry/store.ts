import fs from 'node:fs/promises';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { TelemetryEvent, TelemetrySummary } from './schema.js';

const TELEMETRY_PATH = new URL('../../../.telemetry.json', import.meta.url);

export async function loadTelemetryEvents(): Promise<TelemetryEvent[]> {
  try {
    const raw = await fs.readFile(TELEMETRY_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    // Parse with zod to validate structure, cast eventType via coerce
    const EventRowSchema = z.object({
      id: z.string(),
      timestamp: z.string(),
      sessionId: z.string().optional(),
      channel: z.string(),
      eventType: z.string(),
      command: z.string().optional(),
      durationMs: z.number().optional(),
      error: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
      ok: z.boolean().default(true),
    });
    return z.array(EventRowSchema).parse(parsed) as TelemetryEvent[];
  } catch {
    return [];
  }
}

export async function saveTelemetryEvents(events: TelemetryEvent[]): Promise<void> {
  await fs.mkdir(new URL('.', TELEMETRY_PATH).pathname, { recursive: true });
  await fs.writeFile(TELEMETRY_PATH, JSON.stringify(events, null, 2));
}

export async function recordEvent(event: Omit<TelemetryEvent, 'id' | 'timestamp'>): Promise<TelemetryEvent> {
  const events = await loadTelemetryEvents();
  const fullEvent: TelemetryEvent = {
    ...event,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
  };
  events.push(fullEvent);
  // Keep last 50k events
  if (events.length > 50_000) {
    events.splice(0, events.length - 50_000);
  }
  await saveTelemetryEvents(events);
  return fullEvent;
}

function percentile(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * p);
  return sorted[Math.min(idx, sorted.length - 1)];
}

export async function computeSummary(periodStart?: string, periodEnd?: string): Promise<TelemetrySummary> {
  const events = await loadTelemetryEvents();
  const end = periodEnd ? new Date(periodEnd) : new Date();
  const start = periodStart ? new Date(periodStart) : new Date(end.getTime() - 7 * 86400 * 1000);

  const window = events.filter((e) => {
    const t = new Date(e.timestamp);
    return t >= start && t <= end;
  });

  const summary: TelemetrySummary = {
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    commandCounts: {},
    commandDurationsMs: {},
    errorCounts: {},
    llmRequestCount: 0,
    llmErrorCount: 0,
    rateLimitCount: 0,
    queueJoinedCount: 0,
    queueProcessedCount: 0,
    channelCounts: {},
    totalErrors: 0,
  };

  for (const event of window) {
    // channel
    summary.channelCounts[event.channel] = (summary.channelCounts[event.channel] || 0) + 1;

    if (event.command) {
      summary.commandCounts[event.command] = (summary.commandCounts[event.command] || 0) + 1;
      if (event.durationMs !== undefined) {
        if (!summary.commandDurationsMs[event.command]) {
          summary.commandDurationsMs[event.command] = [];
        }
        summary.commandDurationsMs[event.command].push(event.durationMs);
      }
    }

    if (event.eventType === 'llm_error') {
      summary.llmErrorCount++;
      summary.totalErrors++;
    }
    if (event.eventType === 'llm_request') summary.llmRequestCount++;
    if (event.eventType === 'rate_limited') summary.rateLimitCount++;
    if (event.eventType === 'queue_joined') summary.queueJoinedCount++;
    if (event.eventType === 'queue_processed') summary.queueProcessedCount++;

    if (event.eventType === 'command_error' || event.eventType === 'tool_error') {
      const key = event.command || event.eventType;
      summary.errorCounts[key] = (summary.errorCounts[key] || 0) + 1;
      summary.totalErrors++;
    }
  }

  return summary;
}

export async function getCommandPerfSummary(): Promise<Record<string, {
  count: number;
  p50ms: number;
  p95ms: number;
  errors: number;
}>> {
  const summary = await computeSummary();
  const result: Record<string, { count: number; p50ms: number; p95ms: number; errors: number }> = {};
  for (const [cmd, durations] of Object.entries(summary.commandDurationsMs)) {
    result[cmd] = {
      count: summary.commandCounts[cmd] || 0,
      p50ms: percentile(durations, 0.5),
      p95ms: percentile(durations, 0.95),
      errors: summary.errorCounts[cmd] || 0,
    };
  }
  return result;
}

export async function getDeprecationCandidates(threshold = 0.02, lookbackDays = 30): Promise<Array<{ command: string; count: number; proportion: number }>> {
  const summary = await computeSummary(
    new Date(Date.now() - lookbackDays * 86400 * 1000).toISOString()
  );
  const total = Object.values(summary.commandCounts).reduce((a, b) => a + b, 0);
  if (!total) return [];
  return Object.entries(summary.commandCounts)
    .map(([command, count]) => ({ command, count, proportion: count / total }))
    .filter((c) => c.proportion < threshold)
    .sort((a, b) => a.proportion - b.proportion);
}
