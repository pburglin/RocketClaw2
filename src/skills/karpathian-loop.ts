import { runDoctorChecks } from '../core/doctor.js';
import { getRecommendedNextActions } from '../core/next-actions.js';
import { loadHarnessRuns } from '../harness/store.js';
import { computeSummary } from '../telemetry/store.js';

export type KarpathianLoopMetrics = {
  totalCommands: number;
  totalErrors: number;
  llmRequests: number;
  llmErrors: number;
  rateLimits: number;
  failedHarnessRuns: number;
  successfulHarnessRuns: number;
  approvedPlans: number;
  draftPlans: number;
  handoffDerivedArtifacts: number;
};

export type KarpathianLoopWindow = {
  start: string;
  end: string;
};

export type KarpathianLoopDelta = {
  label: string;
  current: number;
  previous: number;
  delta: number;
};

export type KarpathianLoopScorecard = {
  periodDays: number;
  currentWindow: KarpathianLoopWindow;
  previousWindow: KarpathianLoopWindow;
  currentMetrics: KarpathianLoopMetrics;
  previousMetrics: KarpathianLoopMetrics;
  deltas: KarpathianLoopDelta[];
  doctorOk: boolean;
  doctorWarnings: Array<{ name: string; detail: string }>;
  nextActions: string[];
  improvingSignals: string[];
  regressingSignals: string[];
  unclearSignals: string[];
  focusRecommendation: string;
};

function sumValues(values: Record<string, number>): number {
  return Object.values(values).reduce((sum, value) => sum + value, 0);
}

function selectTimestamp(item: Record<string, unknown>): number {
  const raw = String(item.updatedAt ?? item.createdAt ?? '');
  return Date.parse(raw) || 0;
}

function buildHarnessMetrics(items: Array<Record<string, unknown>>, startMs: number, endMs: number): Pick<KarpathianLoopMetrics, 'failedHarnessRuns' | 'successfulHarnessRuns' | 'approvedPlans' | 'draftPlans' | 'handoffDerivedArtifacts'> {
  const window = items.filter((item) => {
    const ts = selectTimestamp(item);
    return ts >= startMs && ts <= endMs;
  });

  return {
    failedHarnessRuns: window.filter((item) => (item.kind ?? 'run') !== 'plan' && item.ok === false).length,
    successfulHarnessRuns: window.filter((item) => (item.kind ?? 'run') !== 'plan' && item.ok === true).length,
    approvedPlans: window.filter((item) => item.kind === 'plan' && item.approvalStatus === 'approved').length,
    draftPlans: window.filter((item) => item.kind === 'plan' && item.approvalStatus === 'draft').length,
    handoffDerivedArtifacts: window.filter((item) => typeof item.sourceHandoffId === 'string' && item.sourceHandoffId.trim().length > 0).length,
  };
}

function describeDelta(label: string, current: number, previous: number, preferLower: boolean): string | null {
  if (current === previous) return null;
  const delta = current - previous;
  const direction = delta > 0 ? 'up' : 'down';
  const amount = Math.abs(delta);
  const good = preferLower ? delta < 0 : delta > 0;
  return `${label} ${direction} by ${amount} (${good ? 'better' : 'worse'})`;
}

function chooseFocusRecommendation(scorecard: KarpathianLoopScorecard): string {
  if (scorecard.doctorWarnings.length > 0) {
    return `Address the highest-signal doctor warning first: ${scorecard.doctorWarnings[0]!.detail}`;
  }
  if (scorecard.currentMetrics.failedHarnessRuns > 0) {
    return 'Inspect recent failed harness runs and critic feedback before starting another autonomous iteration.';
  }
  if (scorecard.currentMetrics.totalErrors > scorecard.previousMetrics.totalErrors) {
    return 'Telemetry errors increased in the current window; review the top failing commands before adding new scope.';
  }
  return scorecard.nextActions[0] ?? 'Signals look stable. Choose one measurable workflow improvement and capture a new baseline after the change.';
}

export async function buildKarpathianLoopScorecard(periodDays = 7, root?: string): Promise<KarpathianLoopScorecard> {
  const now = Date.now();
  const windowMs = periodDays * 86400 * 1000;
  const currentStartMs = now - windowMs;
  const previousStartMs = currentStartMs - windowMs;

  const currentWindow = {
    start: new Date(currentStartMs).toISOString(),
    end: new Date(now).toISOString(),
  };
  const previousWindow = {
    start: new Date(previousStartMs).toISOString(),
    end: new Date(currentStartMs).toISOString(),
  };

  const [currentTelemetry, previousTelemetry, doctor, nextActions, harnessRuns] = await Promise.all([
    computeSummary(currentWindow.start, currentWindow.end),
    computeSummary(previousWindow.start, previousWindow.end),
    runDoctorChecks(root),
    getRecommendedNextActions(root),
    loadHarnessRuns(root),
  ]);

  const currentHarness = buildHarnessMetrics(harnessRuns, currentStartMs, now);
  const previousHarness = buildHarnessMetrics(harnessRuns, previousStartMs, currentStartMs);

  const currentMetrics: KarpathianLoopMetrics = {
    totalCommands: sumValues(currentTelemetry.commandCounts),
    totalErrors: currentTelemetry.totalErrors,
    llmRequests: currentTelemetry.llmRequestCount,
    llmErrors: currentTelemetry.llmErrorCount,
    rateLimits: currentTelemetry.rateLimitCount,
    ...currentHarness,
  };

  const previousMetrics: KarpathianLoopMetrics = {
    totalCommands: sumValues(previousTelemetry.commandCounts),
    totalErrors: previousTelemetry.totalErrors,
    llmRequests: previousTelemetry.llmRequestCount,
    llmErrors: previousTelemetry.llmErrorCount,
    rateLimits: previousTelemetry.rateLimitCount,
    ...previousHarness,
  };

  const deltas: KarpathianLoopDelta[] = [
    { label: 'totalCommands', current: currentMetrics.totalCommands, previous: previousMetrics.totalCommands, delta: currentMetrics.totalCommands - previousMetrics.totalCommands },
    { label: 'totalErrors', current: currentMetrics.totalErrors, previous: previousMetrics.totalErrors, delta: currentMetrics.totalErrors - previousMetrics.totalErrors },
    { label: 'llmRequests', current: currentMetrics.llmRequests, previous: previousMetrics.llmRequests, delta: currentMetrics.llmRequests - previousMetrics.llmRequests },
    { label: 'llmErrors', current: currentMetrics.llmErrors, previous: previousMetrics.llmErrors, delta: currentMetrics.llmErrors - previousMetrics.llmErrors },
    { label: 'rateLimits', current: currentMetrics.rateLimits, previous: previousMetrics.rateLimits, delta: currentMetrics.rateLimits - previousMetrics.rateLimits },
    { label: 'failedHarnessRuns', current: currentMetrics.failedHarnessRuns, previous: previousMetrics.failedHarnessRuns, delta: currentMetrics.failedHarnessRuns - previousMetrics.failedHarnessRuns },
    { label: 'successfulHarnessRuns', current: currentMetrics.successfulHarnessRuns, previous: previousMetrics.successfulHarnessRuns, delta: currentMetrics.successfulHarnessRuns - previousMetrics.successfulHarnessRuns },
    { label: 'handoffDerivedArtifacts', current: currentMetrics.handoffDerivedArtifacts, previous: previousMetrics.handoffDerivedArtifacts, delta: currentMetrics.handoffDerivedArtifacts - previousMetrics.handoffDerivedArtifacts },
  ];

  const improvingSignals = [
    describeDelta('Total errors', currentMetrics.totalErrors, previousMetrics.totalErrors, true),
    describeDelta('LLM errors', currentMetrics.llmErrors, previousMetrics.llmErrors, true),
    describeDelta('Rate limits', currentMetrics.rateLimits, previousMetrics.rateLimits, true),
    describeDelta('Failed harness runs', currentMetrics.failedHarnessRuns, previousMetrics.failedHarnessRuns, true),
    describeDelta('Successful harness runs', currentMetrics.successfulHarnessRuns, previousMetrics.successfulHarnessRuns, false),
    describeDelta('Handoff-derived artifacts', currentMetrics.handoffDerivedArtifacts, previousMetrics.handoffDerivedArtifacts, false),
  ].filter((item): item is string => Boolean(item && item.includes('(better)')));

  const regressingSignals = [
    describeDelta('Total errors', currentMetrics.totalErrors, previousMetrics.totalErrors, true),
    describeDelta('LLM errors', currentMetrics.llmErrors, previousMetrics.llmErrors, true),
    describeDelta('Rate limits', currentMetrics.rateLimits, previousMetrics.rateLimits, true),
    describeDelta('Failed harness runs', currentMetrics.failedHarnessRuns, previousMetrics.failedHarnessRuns, true),
    describeDelta('Successful harness runs', currentMetrics.successfulHarnessRuns, previousMetrics.successfulHarnessRuns, false),
    describeDelta('Handoff-derived artifacts', currentMetrics.handoffDerivedArtifacts, previousMetrics.handoffDerivedArtifacts, false),
  ].filter((item): item is string => Boolean(item && item.includes('(worse)')));

  const unclearSignals: string[] = [];
  if (improvingSignals.length === 0 && regressingSignals.length === 0) {
    unclearSignals.push('Core telemetry and harness signals are mostly flat versus the previous window.');
  }
  if (currentMetrics.totalCommands === 0 && previousMetrics.totalCommands === 0) {
    unclearSignals.push('There is little or no command telemetry yet, so trend quality is still weak.');
  }

  const scorecard: KarpathianLoopScorecard = {
    periodDays,
    currentWindow,
    previousWindow,
    currentMetrics,
    previousMetrics,
    deltas,
    doctorOk: doctor.ok,
    doctorWarnings: doctor.checks.filter((check) => !check.ok).map((check) => ({ name: check.name, detail: check.detail })),
    nextActions,
    improvingSignals,
    regressingSignals,
    unclearSignals,
    focusRecommendation: '',
  };

  scorecard.focusRecommendation = chooseFocusRecommendation(scorecard);
  return scorecard;
}

function formatMetricLine(label: string, current: number, previous: number): string {
  const delta = current - previous;
  const deltaText = `${delta > 0 ? '+' : ''}${delta}`;
  return `- ${label}: ${current} (prev ${previous}, Δ ${deltaText})`;
}

export function formatKarpathianLoopScorecard(scorecard: KarpathianLoopScorecard): string {
  return [
    'RocketClaw2 Karpathian Loop',
    `Current window: ${scorecard.currentWindow.start.slice(0, 10)} → ${scorecard.currentWindow.end.slice(0, 10)} (${scorecard.periodDays}d)`,
    `Previous window: ${scorecard.previousWindow.start.slice(0, 10)} → ${scorecard.previousWindow.end.slice(0, 10)}`,
    'Scorecard:',
    formatMetricLine('Total commands', scorecard.currentMetrics.totalCommands, scorecard.previousMetrics.totalCommands),
    formatMetricLine('Total errors', scorecard.currentMetrics.totalErrors, scorecard.previousMetrics.totalErrors),
    formatMetricLine('LLM requests', scorecard.currentMetrics.llmRequests, scorecard.previousMetrics.llmRequests),
    formatMetricLine('LLM errors', scorecard.currentMetrics.llmErrors, scorecard.previousMetrics.llmErrors),
    formatMetricLine('Rate limits', scorecard.currentMetrics.rateLimits, scorecard.previousMetrics.rateLimits),
    formatMetricLine('Failed harness runs', scorecard.currentMetrics.failedHarnessRuns, scorecard.previousMetrics.failedHarnessRuns),
    formatMetricLine('Successful harness runs', scorecard.currentMetrics.successfulHarnessRuns, scorecard.previousMetrics.successfulHarnessRuns),
    formatMetricLine('Handoff-derived artifacts', scorecard.currentMetrics.handoffDerivedArtifacts, scorecard.previousMetrics.handoffDerivedArtifacts),
    formatMetricLine('Approved plans', scorecard.currentMetrics.approvedPlans, scorecard.previousMetrics.approvedPlans),
    formatMetricLine('Draft plans', scorecard.currentMetrics.draftPlans, scorecard.previousMetrics.draftPlans),
    `Doctor status: ${scorecard.doctorOk ? 'ok' : 'attention-needed'}`,
    'Doctor warnings:',
    ...(scorecard.doctorWarnings.length > 0
      ? scorecard.doctorWarnings.map((warning) => `- ${warning.name}: ${warning.detail}`)
      : ['- none']),
    'Improving signals:',
    ...(scorecard.improvingSignals.length > 0 ? scorecard.improvingSignals.map((item) => `- ${item}`) : ['- none detected']),
    'Regressing signals:',
    ...(scorecard.regressingSignals.length > 0 ? scorecard.regressingSignals.map((item) => `- ${item}`) : ['- none detected']),
    'Unclear signals:',
    ...(scorecard.unclearSignals.length > 0 ? scorecard.unclearSignals.map((item) => `- ${item}`) : ['- none']),
    `Focus recommendation: ${scorecard.focusRecommendation}`,
    'Next operator actions:',
    ...scorecard.nextActions.slice(0, 3).map((item) => `- ${item}`),
  ].join('\n');
}
