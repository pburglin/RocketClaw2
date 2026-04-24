import { buildHarnessPlan, runCodingHarnessFromPlan } from '../harness/coding-harness.js';
import { approveHarnessPlan, saveHarnessRun } from '../harness/store.js';
import type { AppConfig } from '../config/load-config.js';
import { formatCodingHarnessResult } from '../harness/formatters.js';

function buildLlmRecoverySteps(config: AppConfig): string[] {
  const baseUrl = config.llm.baseUrl;
  const model = config.llm.model;
  const auth = '--llm-api-key "$API_KEY"';
  return [
    `rocketclaw2 --llm-base-url "${baseUrl}" ${auth} --llm-model "${model}" llm-status`,
    `rocketclaw2 --llm-base-url "${baseUrl}" ${auth} --llm-model "${model}" llm-test`,
    `rocketclaw2 --llm-base-url "${baseUrl}" ${auth} --llm-model "${model}" llm-query --prompt "Reply with exactly: LLM_OK"`,
    'If that times out too, retry with a known-fast model such as gpt-4o-mini.',
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
): Promise<{ ok: boolean; result?: string; error?: string; planId?: string; artifactPath?: string; approvalRequired?: boolean; nextSteps?: string[] }> {
  try {
    // Step 1: Build a plan
    const planResult = await buildHarnessPlan(config, {
      workspace,
      task,
      validateCommand,
    });

    // Step 2: Save the plan to get a runId
    const planArtifact = await saveHarnessRun(planResult);

    // Step 3: Approve the plan (automatically if requested)
    if (autoApprove) {
      const approveResult = await approveHarnessPlan(planArtifact.runId);

      if (approveResult.approvalStatus !== 'approved') {
        return {
          ok: false,
          error: `Failed to approve plan: status is ${approveResult.approvalStatus}`,
          planId: planArtifact.runId,
          artifactPath: planArtifact.path,
        };
      }
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
    const executionResult = await runCodingHarnessFromPlan(config, planArtifact.runId, {
      maxIterations,
    });

    if (!executionResult.ok) {
      // In the real system, iteration count and guidance are in executionResult even if !ok
      return { ok: false, error: `Execution failed. ${formatCodingHarnessResult(executionResult)}` };
    }

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
