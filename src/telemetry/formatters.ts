import type { TelemetrySummary } from './schema.js';
import { getCommandPerfSummary, getDeprecationCandidates, type LlmPerformanceStats } from './store.js';

export function formatTelemetrySummary(summary: TelemetrySummary): string {
  const lines: string[] = [];
  lines.push(`\n📊 Telemetry Summary (${summary.periodStart.slice(0, 10)} → ${summary.periodEnd.slice(0, 10)})`);
  lines.push('─'.repeat(60));

  // Channel traffic
  lines.push('\n📡 Channel Traffic:');
  for (const [ch, count] of Object.entries(summary.channelCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${ch.padEnd(12)} ${count.toString().padStart(6)} requests`);
  }

  // Command counts
  const sorted = Object.entries(summary.commandCounts).sort((a, b) => b[1] - a[1]);
  lines.push('\n⚡ Commands:');
  if (sorted.length === 0) {
    lines.push('  (no command data yet)');
  } else {
    for (const [cmd, count] of sorted.slice(0, 15)) {
      const pct = (count / Math.max(Object.values(summary.commandCounts).reduce((a, b) => a + b, 0), 1) * 100).toFixed(1);
      lines.push(`  ${cmd.padEnd(20)} ${count.toString().padStart(5)}  (${pct}%)`);
    }
  }

  // LLM stats
  lines.push('\n🤖 LLM:');
  lines.push(`  Requests:   ${summary.llmRequestCount}`);
  lines.push(`  Errors:     ${summary.llmErrorCount}`);
  lines.push(`  Rate-limit: ${summary.rateLimitCount}`);

  // Queue stats
  lines.push('\n📬 Queue:');
  lines.push(`  Joined:     ${summary.queueJoinedCount}`);
  lines.push(`  Processed:  ${summary.queueProcessedCount}`);

  // Errors
  if (summary.totalErrors > 0) {
    lines.push('\n❌ Errors:');
    for (const [cmd, count] of Object.entries(summary.errorCounts).sort((a, b) => b[1] - a[1])) {
      lines.push(`  ${cmd.padEnd(20)} ${count} error(s)`);
    }
  }

  return lines.join('\n');
}

export async function formatPerfReport(): Promise<string> {
  const perf = await getCommandPerfSummary();
  const lines: string[] = ['\n⚡ Command Performance (p50 / p95)\n' + '─'.repeat(50)];
  const entries = Object.entries(perf).sort((a, b) => b[1].count - a[1].count);
  if (entries.length === 0) {
    lines.push('(no performance data yet)');
  } else {
    for (const [cmd, data] of entries) {
      lines.push(`  ${cmd.padEnd(22)} n=${data.count.toString().padStart(4)}  p50=${data.p50ms.toString().padStart(5)}ms  p95=${data.p95ms.toString().padStart(6)}ms  errors=${data.errors}`);
    }
  }
  return lines.join('\n');
}

export async function formatDeprecationReport(): Promise<string> {
  const candidates = await getDeprecationCandidates();
  const lines: string[] = ['\n🗑️ Deprecation Candidates (< 2% of commands over 30 days)\n' + '─'.repeat(55)];
  if (candidates.length === 0) {
    lines.push('(not enough data or all commands are active)');
  } else {
    for (const c of candidates) {
      lines.push(`  ${c.command.padEnd(24)} ${c.count.toString().padStart(4)} uses  (${(c.proportion * 100).toFixed(2)}%)`);
    }
  }
  return lines.join('\n');
}

export function formatLlmPerformanceStats(stats: LlmPerformanceStats): string {
  const lines: string[] = [];
  lines.push('\n🤖 LLM Performance Stats');
  lines.push('─'.repeat(50));
  lines.push(`Window:      ${stats.periodStart.slice(0, 19)} → ${stats.periodEnd.slice(0, 19)}`);
  if (stats.sessionId) lines.push(`Session ID:  ${stats.sessionId}`);
  if (stats.channel) lines.push(`Channel:     ${stats.channel}`);
  lines.push(`Requests:    ${stats.requestCount}`);
  lines.push(`Successful:  ${stats.successCount}`);
  lines.push(`Errors:      ${stats.errorCount}`);
  lines.push(`Success %:   ${(stats.successRate * 100).toFixed(1)}%`);
  lines.push(`Avg time:    ${stats.avgResponseTimeMs.toFixed(0)} ms`);
  lines.push(`Tokens/sec:  ${stats.tokensPerSecond.toFixed(2)}`);
  lines.push(`Avg compl.:  ${stats.avgCompletionTokensPerResponse.toFixed(1)} tokens/response`);
  lines.push(`Avg total:   ${stats.avgTotalTokensPerResponse.toFixed(1)} tokens/response`);
  lines.push(`Prompt tok:  ${stats.totalPromptTokens}`);
  lines.push(`Compl. tok:  ${stats.totalCompletionTokens}`);
  lines.push(`Total tok:   ${stats.totalTokens}`);
  if (stats.estimatedResponseCount > 0) {
    lines.push(`Estimated:   ${stats.estimatedResponseCount} response(s) used token estimates when provider usage was unavailable`);
  }
  if (stats.firstRequestAt) lines.push(`First req:   ${stats.firstRequestAt}`);
  if (stats.lastResponseAt) lines.push(`Last resp:   ${stats.lastResponseAt}`);
  return lines.join('\n');
}
