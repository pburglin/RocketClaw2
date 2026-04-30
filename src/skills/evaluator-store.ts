import { loadHarnessRun, saveHarnessRun } from '../harness/store.js';

export type EvaluatorDecision = 'accepted' | 'rejected' | 'needs-review';

export type PersistedEvaluationRecord = {
  savedAt: string;
  decision: EvaluatorDecision;
  note?: string;
  sourceHandoffId?: string;
  sourceHandoffChain?: string[];
  criteria: Array<{
    criterion: string;
    status: 'passed' | 'failed' | 'needs-review';
    evidence: string;
  }>;
  recommendedNextStep: string;
  revisionSummary: {
    totalIterations: number;
    failedIterations: number;
    passedIterations: number;
    filesCreated: number;
    filesModified: number;
    latestCriticInsight?: string;
    latestGuidance?: string;
  };
};

export async function saveEvaluationDecision(
  runId: string,
  evaluation: PersistedEvaluationRecord,
  root?: string,
): Promise<Record<string, unknown>> {
  const run = await loadHarnessRun(runId, root);
  if (!run) {
    throw new Error(`Harness run not found: ${runId}`);
  }

  const history = Array.isArray(run.evaluationHistory) ? run.evaluationHistory : [];
  const enrichedEvaluation = {
    ...evaluation,
    sourceHandoffId: typeof run.sourceHandoffId === 'string' ? run.sourceHandoffId : evaluation.sourceHandoffId,
    sourceHandoffChain: Array.isArray(run.sourceHandoffChain)
      ? run.sourceHandoffChain.filter((item): item is string => typeof item === 'string')
      : evaluation.sourceHandoffChain,
  };

  const updated = {
    ...run,
    latestEvaluation: enrichedEvaluation,
    evaluationHistory: [...history, enrichedEvaluation],
    evaluationDecision: evaluation.decision,
    evaluationNote: evaluation.note,
    evaluatedAt: evaluation.savedAt,
  };

  await saveHarnessRun(updated as any, root, runId);
  return updated;
}
