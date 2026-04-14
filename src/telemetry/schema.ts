import { z } from 'zod';

export const TelemetryEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  sessionId: z.string().optional(),
  channel: z.string(), // e.g. 'whatsapp', 'tui', 'cli', 'http'
  eventType: z.enum([
    'command_invoked',
    'command_completed',
    'command_error',
    'llm_request',
    'llm_response',
    'llm_error',
    'rate_limited',
    'queue_joined',
    'queue_processed',
    'tool_invoked',
    'tool_error',
  ]),
  command: z.string().optional(), // e.g. 'remember', 'approve', 'chat'
  durationMs: z.number().optional(), // execution time in ms
  error: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  ok: z.boolean().default(true),
});

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;

export const TelemetrySummarySchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  commandCounts: z.record(z.number()).default({}),
  commandDurationsMs: z.record(z.array(z.number())).default({}), // raw samples for p50/p95
  errorCounts: z.record(z.number()).default({}),
  llmRequestCount: z.number().default(0),
  llmErrorCount: z.number().default(0),
  rateLimitCount: z.number().default(0),
  queueJoinedCount: z.number().default(0),
  queueProcessedCount: z.number().default(0),
  channelCounts: z.record(z.number()).default({}),
  totalErrors: z.number().default(0),
});

export type TelemetrySummary = z.infer<typeof TelemetrySummarySchema>;
