import { buildHarnessPlan, runCodingHarnessFromPlan } from '../harness/coding-harness.js';
import { approveHarnessPlan, saveHarnessRun } from '../harness/store.js';
import type { AppConfig } from '../config/load-config.js';
import { formatCodingHarnessResult } from '../harness/formatters.js';

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
  autoApprove: boolean = true
): Promise<{ ok: boolean; result?: string; error?: string; planId?: string; artifactPath?: string; approvalRequired?: boolean; nextSteps?: string[] }> {
  try {
    // Step 1: Build a plan
    const planResult = await buildHarnessPlan(config, {
      workspace,
      task,
      validateCommand
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
    return { ok: false, error: `Autonomous coding failed: ${errorMsg}` };
  }
}