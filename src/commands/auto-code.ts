import { buildHarnessPlan, resumeCodingHarnessRun, runCodingHarnessFromPlan } from '../harness/coding-harness.js';
import { approveHarnessPlan, findLatestHarnessArtifact, saveHarnessRun } from '../harness/store.js';
import type { AppConfig } from '../config/load-config.js';
import { formatCodingHarnessResult } from '../harness/formatters.js';
import type { LlmTraceEvent } from '../llm/client.js';

export interface AutoCodeProgressEvent {
  stage: string;
  message: string;
  iteration?: number;
}

function matchesWorkspaceAndTask(artifact: Record<string, unknown>, workspace: string, task: string): boolean {
  return String(artifact.workspace ?? '') === workspace && String(artifact.task ?? '') === task;
}

function buildLlmRecoverySteps(config: AppConfig): string[] {
  const baseUrl = config.llm.baseUrl;
  const model = config.llm.model;
  return [
    `rocketclaw2 --llm-base-url "${baseUrl}" --llm-api-key "$API_KEY" --llm-model "${model}" llm-status`,
    `rocketclaw2 --llm-base-url "${baseUrl}" --llm-api-key "$API_KEY" --llm-model "${model}" llm-query --prompt "Reply with exactly: LLM_OK"`,
    `rocketclaw2 --llm-base-url "${baseUrl}" --llm-api-key "$API_KEY" --llm-model "gpt-4o-mini" llm-query --prompt "Reply with exactly: LLM_OK"`,
    'If llm-status still says the API key is missing, confirm your shell expanded $API_KEY before rerunning the command.',
  ];
}

/**
 * Run a streamlined autonomous coding flow that combines planning, approval, and execution
 * with smart defaults for minimal user intervention.
 */
export async function runAutoCode(
  config: AppConfig,
  workspace: string,
  task: string,
  validateCommand: string = 'true',
  maxIterations: number = 5,
  autoApprove: boolean = true,
  onProgress?: (event: AutoCodeProgressEvent) => void,
  onLlmTrace?: (event: LlmTraceEvent) => void,
  onLlmToken?: (chunk: string, label?: string) => void,
): Promise<{ ok: boolean; result?: string; error?: string; planId?: string; artifactPath?: string; approvalRequired?: boolean; nextSteps?: string[] }> {
  try {
    const resumableRun = await findLatestHarnessArtifact((artifact) =>
      (artifact.kind ?? 'run') !== 'plan'
      && matchesWorkspaceAndTask(artifact, workspace, task)
      && artifact.ok !== true,
    );

    if (resumableRun) {
      const resumeId = String(resumableRun.runId ?? '');
      onProgress?.({ stage: 'resume-detected', message: `Resuming previous interrupted run ${resumeId}` });
      const resumed = await resumeCodingHarnessRun(config, resumeId, {
        maxIterations,
        onProgress: (event) => onProgress?.({ stage: event.stage, message: event.message, iteration: event.iteration }),
        onLlmTrace,
        onLlmToken,
      });
      if (!resumed.ok) {
        return { ok: false, error: `Execution failed. ${formatCodingHarnessResult(resumed)}`, artifactPath: resumed.artifactPath };
      }
      return {
        ok: true,
        result: `Autonomous coding resumed successfully.\n${formatCodingHarnessResult(resumed)}`,
        artifactPath: resumed.artifactPath,
      };
    }

    const approvedPlan = await findLatestHarnessArtifact((artifact) =>
      artifact.kind === 'plan'
      && artifact.approvalStatus === 'approved'
      && matchesWorkspaceAndTask(artifact, workspace, task),
    );

    if (approvedPlan) {
      const planId = String(approvedPlan.runId ?? '');
      onProgress?.({ stage: 'resume-plan-detected', message: `Reusing approved plan ${planId}` });
      const executionResult = await runCodingHarnessFromPlan(config, planId, {
        maxIterations,
        onProgress: (event) => onProgress?.({ stage: event.stage, message: event.message, iteration: event.iteration }),
        onLlmTrace,
        onLlmToken,
      });
      if (!executionResult.ok) {
        return { ok: false, error: `Execution failed. ${formatCodingHarnessResult(executionResult)}`, planId, artifactPath: executionResult.artifactPath };
      }
      return {
        ok: true,
        result: `Autonomous coding resumed from approved plan.\n${formatCodingHarnessResult(executionResult)}`,
        planId,
        artifactPath: executionResult.artifactPath,
      };
    }

    onProgress?.({ stage: 'planning-start', message: 'Building implementation plan from the task prompt' });
    // Step 1: Build a plan
    const planResult = await buildHarnessPlan(config, {
      workspace,
      task,
      validateCommand,
    }, onLlmTrace, (event) => onProgress?.(event), onLlmToken);

    onProgress?.({ stage: 'planning-complete', message: 'Plan received from model' });

    // Step 2: Save the plan to get a runId
    const planArtifact = await saveHarnessRun(planResult);
    onProgress?.({ stage: 'plan-saved', message: `Saved plan artifact ${planArtifact.runId}` });

    // Step 3: Approve the plan (automatically if requested)
    if (autoApprove) {
      onProgress?.({ stage: 'plan-approval-start', message: `Auto-approving plan ${planArtifact.runId}` });
      const approveResult = await approveHarnessPlan(planArtifact.runId);

      if (approveResult.approvalStatus !== 'approved') {
        return {
          ok: false,
          error: `Failed to approve plan: status is ${approveResult.approvalStatus}`,
          planId: planArtifact.runId,
          artifactPath: planArtifact.path,
        };
      }
      onProgress?.({ stage: 'plan-approved', message: `Plan ${planArtifact.runId} approved` });
    } else {
      return {
        ok: false,
        error: 'Manual approval required before execution.',
        planId: planArtifact.runId,
        artifactPath: planArtifact.path,
        approvalRequired: true,
        nextSteps: [
          `rocketclaw2 harness-show --id ${planArtifact.runId} --plan`,
          `rocketclaw2 harness-approve --id ${planArtifact.runId}`,
          `rocketclaw2 harness-run --id ${planArtifact.runId} --require-approved-plan`,
        ],
      };
    }

    // Step 4: Execute the approved plan
    onProgress?.({ stage: 'execution-start', message: `Executing approved plan ${planArtifact.runId}` });
    const executionResult = await runCodingHarnessFromPlan(config, planArtifact.runId, {
      maxIterations,
      onProgress: (event) => onProgress?.({ stage: event.stage, message: event.message, iteration: event.iteration }),
      onLlmTrace,
      onLlmToken,
    });

    if (!executionResult.ok) {
      // In the real system, iteration count and guidance are in executionResult even if !ok
      return { ok: false, error: `Execution failed. ${formatCodingHarnessResult(executionResult)}` };
    }

    onProgress?.({ stage: 'execution-complete', message: 'Autonomous coding finished successfully' });
    return {
      ok: true,
      result: `Autonomous coding completed successfully.\n${formatCodingHarnessResult(executionResult)}`,
      planId: planArtifact.runId,
      artifactPath: planArtifact.path,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const looksLlmRelated = /\bLLM\b|provider timed out|message content|chat\/completions|model may be invalid|authentication failed|endpoint not found|rate limit/i.test(errorMsg);
    return {
      ok: false,
      error: `Autonomous coding failed: ${errorMsg}`,
      nextSteps: looksLlmRelated ? buildLlmRecoverySteps(config) : undefined,
    };
  }
}
