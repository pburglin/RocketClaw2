import { loadIterationEntries, type IterationEntry } from '../harness/iteration-store.js';
import { loadHarnessRun } from '../harness/store.js';

export type EvaluatorCriterionStatus = 'passed' | 'failed' | 'needs-review';

export type EvaluatorCriterionResult = {
  criterion: string;
  status: EvaluatorCriterionStatus;
  evidence: string;
};

export type RevisionSummary = {
  totalIterations: number;
  failedIterations: number;
  passedIterations: number;
  filesCreated: number;
  filesModified: number;
  latestCriticInsight?: string;
  latestGuidance?: string;
};

export type EvaluatorOptimizerReport = {
  runId: string;
  kind: string;
  workspace: string;
  task: string;
  validateCommand: string;
  approvalStatus?: string;
  ok?: boolean;
  sourceHandoffId?: string;
  sourceHandoffChain?: string[];
  latestSavedDecision?: string;
  latestSavedAt?: string;
  criteria: EvaluatorCriterionResult[];
  revisionSummary: RevisionSummary;
  recommendedNextStep: string;
};

function summarizeRevisions(entries: IterationEntry[], run: Record<string, unknown>): RevisionSummary {
  const latest = entries.at(-1);
  return {
    totalIterations: entries.length,
    failedIterations: entries.filter((entry) => !entry.validationPassed).length,
    passedIterations: entries.filter((entry) => entry.validationPassed).length,
    filesCreated: entries.reduce((sum, entry) => sum + entry.filesCreated.length, 0),
    filesModified: entries.reduce((sum, entry) => sum + entry.filesModified.length, 0),
    latestCriticInsight: latest?.criticInsight ?? (typeof run.lastCriticInsight === 'string' ? run.lastCriticInsight : undefined),
    latestGuidance: latest?.guidance ?? (typeof run.lastGuidance === 'string' ? run.lastGuidance : undefined),
  };
}

function evaluateCriterion(criterion: string, run: Record<string, unknown>, revisions: RevisionSummary): EvaluatorCriterionResult {
  const lower = criterion.toLowerCase();
  const ok = run.ok === true;
  const approvalStatus = String(run.approvalStatus ?? 'n/a');
  const latestCritic = revisions.latestCriticInsight;

  if (/(validate|validation|build|test|lint|pass)/.test(lower)) {
    return {
      criterion,
      status: ok ? 'passed' : 'failed',
      evidence: ok
        ? `Validation succeeded for \`${String(run.validateCommand ?? 'n/a')}\`.`
        : `Latest validation did not pass for \`${String(run.validateCommand ?? 'n/a')}\`.`,
    };
  }

  if (/(approve|approval|reviewed plan|reviewable plan)/.test(lower)) {
    return {
      criterion,
      status: approvalStatus === 'approved' ? 'passed' : approvalStatus === 'draft' ? 'failed' : 'needs-review',
      evidence: `Approval status is ${approvalStatus}.`,
    };
  }

  if (/(critic|root cause|issue|regression|error)/.test(lower)) {
    return {
      criterion,
      status: latestCritic ? 'failed' : 'passed',
      evidence: latestCritic ? `Latest critic insight: ${latestCritic}` : 'No saved critic insight is attached to the latest revision.',
    };
  }

  if (/(iterate|revision|bounded loop)/.test(lower)) {
    return {
      criterion,
      status: revisions.totalIterations > 0 ? 'passed' : 'needs-review',
      evidence: `Recorded ${revisions.totalIterations} revision iteration(s).`,
    };
  }

  return {
    criterion,
    status: 'needs-review',
    evidence: 'No built-in heuristic matched this criterion; operator review is still required.',
  };
}

function chooseNextStep(run: Record<string, unknown>, revisions: RevisionSummary, criteria: EvaluatorCriterionResult[]): string {
  if (criteria.some((item) => item.status === 'failed')) {
    if (run.kind === 'plan' && run.approvalStatus === 'draft') {
      return `Inspect the saved plan with \`rocketclaw2 harness-show --id ${String(run.runId)} --plan\` before approving it.`;
    }
    if (run.ok === false) {
      return `Inspect failed iterations with \`rocketclaw2 harness-iterations --id ${String(run.runId)} --failed-only\` and resume if the critic direction is still useful.`;
    }
  }
  if (criteria.some((item) => item.status === 'needs-review')) {
    return 'Review the criteria that still require human judgment before accepting this artifact.';
  }
  if (run.kind === 'plan' && run.approvalStatus === 'approved') {
    return `Execute the approved plan with \`rocketclaw2 harness-run --id ${String(run.runId)} --require-approved-plan\`.`;
  }
  if (run.ok === true) {
    return `Validation passed. Re-run \`rocketclaw2 harness-validate --id ${String(run.runId)}\` only if you need a fresh gate.`;
  }
  if (revisions.totalIterations === 0) {
    return 'No revision history is recorded yet; create or execute a candidate artifact before evaluating it further.';
  }
  return 'Inspect the artifact and decide whether another revision loop is worth it.';
}

export async function buildEvaluatorOptimizerReport(runId: string, criteria: string[] = [], root?: string): Promise<EvaluatorOptimizerReport> {
  const run = await loadHarnessRun(runId, root);
  if (!run) {
    throw new Error(`Harness run not found: ${runId}`);
  }
  const entries = await loadIterationEntries(runId, root);
  const revisionSummary = summarizeRevisions(entries, run);
  const normalizedCriteria = criteria.length > 0
    ? criteria
    : [
        'Validation passes cleanly',
        'Plan or artifact is reviewable/approved',
        'No unresolved critic insight remains',
        'Revision loop stayed bounded and inspectable',
      ];
  const criterionResults = normalizedCriteria.map((criterion) => evaluateCriterion(criterion, run, revisionSummary));

  return {
    runId,
    kind: String(run.kind ?? 'run'),
    workspace: String(run.workspace ?? 'n/a'),
    task: String(run.task ?? 'n/a'),
    validateCommand: String(run.validateCommand ?? 'n/a'),
    approvalStatus: typeof run.approvalStatus === 'string' ? run.approvalStatus : undefined,
    ok: typeof run.ok === 'boolean' ? run.ok : undefined,
    sourceHandoffId: typeof run.sourceHandoffId === 'string' ? run.sourceHandoffId : undefined,
    sourceHandoffChain: Array.isArray(run.sourceHandoffChain)
      ? run.sourceHandoffChain.filter((item): item is string => typeof item === 'string')
      : undefined,
    latestSavedDecision: typeof run.evaluationDecision === 'string' ? run.evaluationDecision : undefined,
    latestSavedAt: typeof run.evaluatedAt === 'string' ? run.evaluatedAt : undefined,
    criteria: criterionResults,
    revisionSummary,
    recommendedNextStep: chooseNextStep(run, revisionSummary, criterionResults),
  };
}

export function formatEvaluatorOptimizerReport(report: EvaluatorOptimizerReport): string {
  return [
    'RocketClaw2 Evaluator-Optimizer',
    `Run ID: ${report.runId}`,
    `Kind: ${report.kind}`,
    `Workspace: ${report.workspace}`,
    `Task: ${report.task}`,
    `Validation command: ${report.validateCommand}`,
    `Approval: ${report.approvalStatus ?? 'n/a'}`,
    `Status: ${report.ok === undefined ? 'n/a' : report.ok ? 'passed' : 'failed'}`,
    `Source handoff: ${report.sourceHandoffId ?? 'n/a'}`,
    `Source handoff chain: ${report.sourceHandoffChain?.join(' -> ') || 'n/a'}`,
    `Latest saved decision: ${report.latestSavedDecision ?? 'none'}${report.latestSavedAt ? ` (${report.latestSavedAt})` : ''}`,
    'Criteria:',
    ...report.criteria.map((item) => `- [${item.status}] ${item.criterion} — ${item.evidence}`),
    'Revision summary:',
    `- iterations: ${report.revisionSummary.totalIterations}`,
    `- failed iterations: ${report.revisionSummary.failedIterations}`,
    `- passed iterations: ${report.revisionSummary.passedIterations}`,
    `- files created: ${report.revisionSummary.filesCreated}`,
    `- files modified: ${report.revisionSummary.filesModified}`,
    `- latest critic: ${report.revisionSummary.latestCriticInsight ?? 'none'}`,
    `- latest guidance: ${report.revisionSummary.latestGuidance ?? 'none'}`,
    `Recommended next step: ${report.recommendedNextStep}`,
  ].join('\n');
}
