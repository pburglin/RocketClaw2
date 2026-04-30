import { describe, expect, it } from 'vitest';
import { formatKarpathianLoopScorecard } from '../src/skills/karpathian-loop.js';

describe('karpathian loop', () => {
  it('formats a compare/improve scorecard', () => {
    const text = formatKarpathianLoopScorecard({
      periodDays: 7,
      currentWindow: { start: '2026-04-22T00:00:00.000Z', end: '2026-04-29T00:00:00.000Z' },
      previousWindow: { start: '2026-04-15T00:00:00.000Z', end: '2026-04-22T00:00:00.000Z' },
      currentMetrics: {
        totalCommands: 12,
        totalErrors: 1,
        llmRequests: 4,
        llmErrors: 0,
        rateLimits: 0,
        failedHarnessRuns: 1,
        successfulHarnessRuns: 2,
        approvedPlans: 1,
        draftPlans: 0,
        handoffDerivedArtifacts: 3,
      },
      previousMetrics: {
        totalCommands: 9,
        totalErrors: 3,
        llmRequests: 3,
        llmErrors: 1,
        rateLimits: 0,
        failedHarnessRuns: 2,
        successfulHarnessRuns: 1,
        approvedPlans: 0,
        draftPlans: 1,
        handoffDerivedArtifacts: 1,
      },
      deltas: [],
      doctorOk: false,
      doctorWarnings: [{ name: 'session-activity', detail: 'Sessions=0, messages=0, latest=n/a' }],
      nextActions: ['Create an initial session with `rocketclaw2 session-create --title "First Session"` to start exercising runtime workflows.'],
      improvingSignals: ['Total errors down by 2 (better)', 'Handoff-derived artifacts up by 2 (better)'],
      regressingSignals: [],
      unclearSignals: [],
      focusRecommendation: 'Address the highest-signal doctor warning first: Sessions=0, messages=0, latest=n/a',
    });

    expect(text).toContain('RocketClaw2 Karpathian Loop');
    expect(text).toContain('Scorecard:');
    expect(text).toContain('Doctor warnings:');
    expect(text).toContain('Handoff-derived artifacts: 3 (prev 1, Δ +2)');
    expect(text).toContain('Improving signals:');
    expect(text).toContain('Focus recommendation:');
  });
});
