import { runLlmQuery } from '../llm/client.js';
import { buildHarnessPlan, runCodingHarnessFromPlan } from '../harness/coding-harness.js';
import { approveHarnessPlan, loadHarnessRun } from '../harness/store.js';
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
  validateCommand: string = 'echo "Task completed"',
  maxIterations: number = 5,
  autoApprove: boolean = true
): Promise<{ ok: boolean; result?: string; error?: string }> {
  try {
    // Step 1: Build a plan
    const planResult = await buildHarnessPlan({
      config,
      workspace,
      task,
      validateCommand,
      maxIterations
    });

    if (!planResult.ok) {
      return { ok: false, error: `Failed to build plan: ${planResult.error}` };
    }

    // Step 2: Approve the plan (automatically if requested)
    if (autoApprove) {
      const approveResult = await approveHarnessPlan({
        planId: planResult.planId,
        config
      });

      if (!approveResult.ok) {
        return { ok: false, error: `Failed to approve plan: ${approveResult.error}` };
      }
    } else {
      // In manual mode, we would return the plan for user review
      // For now, we'll proceed with auto-approve as the default behavior
      console.log('Plan created. Use harness-approve to approve it manually.');
      return { ok: false, error: 'Manual approval required. Use harness-approve command.' };
    }

    // Step 3: Execute the approved plan
    const executionResult = await runCodingHarnessFromPlan({
      planId: planResult.planId,
      config
    });

    if (!executionResult.ok) {
      return { ok: false, error: `Execution failed: ${executionResult.error}` };
    }

    return {
      ok: true,
      result: `Autonomous coding completed successfully. ${formatCodingHarnessResult(executionResult)}`
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Autonomous coding failed: ${errorMsg}` };
  }
}