import type { AppConfig } from '../config/load-config.js';
import { loadApprovals } from '../approval/store.js';
import { buildWorldModel } from '../core/world-model.js';
import { loadHarnessRun } from '../harness/store.js';
import { saveHandoffArtifact } from './store.js';

export async function createHandoffArtifact(
  config: AppConfig,
  root?: string,
  options: { owner?: string; notes?: string; relatedHarnessId?: string; relatedApprovalId?: string; parentHandoffId?: string } = {},
) {

  const worldModel = await buildWorldModel(root, config);

  const relatedHarness = options.relatedHarnessId
    ? await loadHarnessRun(options.relatedHarnessId, root)
    : null;
  if (options.relatedHarnessId && !relatedHarness) {
    throw new Error(`Harness artifact not found: ${options.relatedHarnessId}`);
  }

  const relatedApproval = options.relatedApprovalId
    ? (await loadApprovals(root)).find((item) => item.id === options.relatedApprovalId) ?? null
    : null;
  if (options.relatedApprovalId && !relatedApproval) {
    throw new Error(`Approval request not found: ${options.relatedApprovalId}`);
  }

  return saveHandoffArtifact({
    activeGoal: worldModel.activeGoal,
    environment: {
      profile: worldModel.environment.profile,
      llmModel: worldModel.environment.llmModel,
      llmRetryCount: worldModel.environment.llmRetryCount,
      llmApiKeyConfigured: worldModel.environment.llmApiKeyConfigured,
      whatsappEnabled: worldModel.environment.whatsappEnabled,
      whatsappMode: worldModel.environment.whatsappMode,
      sessionCount: worldModel.environment.sessionCount,
      messageCount: worldModel.environment.messageCount,
      semanticMemoryEntries: worldModel.environment.semanticMemoryEntries,
      pendingApprovals: worldModel.environment.pendingApprovals,
      latestSessionUpdate: worldModel.environment.latestSessionUpdate ?? null,
    },
    handoff: {
      ...(options.owner ? { owner: options.owner } : {}),
      ...(options.notes ? { notes: options.notes } : {}),
    },
    related: {
      ...(relatedHarness
        ? {
            harness: {
              runId: String(relatedHarness.runId ?? options.relatedHarnessId),
              kind: typeof relatedHarness.kind === 'string' ? relatedHarness.kind : undefined,
              ok: typeof relatedHarness.ok === 'boolean' ? relatedHarness.ok : undefined,
              approvalStatus: typeof relatedHarness.approvalStatus === 'string' ? relatedHarness.approvalStatus : undefined,
            },
          }
        : {}),
      ...(relatedApproval
        ? {
            approval: {
              id: relatedApproval.id,
              kind: relatedApproval.kind,
              status: relatedApproval.status,
              target: relatedApproval.target,
            },
          }
        : {}),
    },
    ...(options.parentHandoffId ? { parentHandoffId: options.parentHandoffId } : {}),
    constraints: worldModel.constraints,
    risks: worldModel.risks,
    nextActions: worldModel.nextActions,
    source: {
      worldModelCommand: 'rocketclaw2 world-model',
      workspaceStatusCommand: 'rocketclaw2 workspace-status',
      systemSummaryCommand: 'rocketclaw2 system-summary',
    },
  }, root);
}
