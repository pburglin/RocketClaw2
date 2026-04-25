import { loadAppConfig } from '../tools/config-store.js';
import { buildSystemSummary } from '../config/system-summary.js';
import type { AppConfig } from '../config/load-config.js';
import { buildWorkspaceStatus } from './workspace-status.js';

export async function buildWorldModel(root?: string, configOverride?: AppConfig) {
  const config = configOverride ?? await loadAppConfig(root);
  const [systemSummary, workspaceStatus] = await Promise.all([
    Promise.resolve(buildSystemSummary(config)),
    buildWorkspaceStatus(root),
  ]);

  const constraints: string[] = [];
  if (workspaceStatus.whatsappEnabled) {
    constraints.push(`WhatsApp mode: ${workspaceStatus.whatsappMode}`);
    if (workspaceStatus.whatsappSelfChatOnly) {
      constraints.push('WhatsApp self-chat-only posture is enabled');
    }
  }
  if (systemSummary.yolo.enabled) {
    constraints.push('Yolo mode is enabled; approval bypass risk is higher');
  }

  const risks: string[] = [];
  if (workspaceStatus.pendingApprovals > 0) {
    risks.push(`${workspaceStatus.pendingApprovals} approval item(s) still pending`);
  }
  if (workspaceStatus.whatsappEnabled && workspaceStatus.whatsappMode === 'session' && !workspaceStatus.whatsappSessionConfigured) {
    risks.push('WhatsApp session mode is enabled but no local session is configured');
  }
  if (workspaceStatus.sessionCount === 0) {
    risks.push('No persisted sessions yet; runtime workflows have limited real usage evidence');
  }
  if (!systemSummary.llm.apiKeyConfigured) {
    risks.push('No LLM API key configured in current runtime posture');
  }

  const activeGoal = workspaceStatus.nextActions[0] ?? 'Keep runtime posture healthy and continue the highest-value roadmap improvement.';

  return {
    activeGoal,
    environment: {
      profile: systemSummary.profile,
      yoloEnabled: systemSummary.yolo.enabled,
      llmModel: systemSummary.llm.model,
      llmRetryCount: systemSummary.llm.retryCount,
      llmApiKeyConfigured: systemSummary.llm.apiKeyConfigured,
      whatsappEnabled: workspaceStatus.whatsappEnabled,
      whatsappMode: workspaceStatus.whatsappMode,
      sessionCount: workspaceStatus.sessionCount,
      messageCount: workspaceStatus.messageCount,
      semanticMemoryEntries: workspaceStatus.semanticMemoryEntries,
      pendingApprovals: workspaceStatus.pendingApprovals,
      latestSessionUpdate: workspaceStatus.latestSessionUpdate,
    },
    constraints,
    risks,
    nextActions: workspaceStatus.nextActions,
  };
}

export function formatWorldModel(model: Awaited<ReturnType<typeof buildWorldModel>>): string {
  return [
    'RocketClaw2 World Model',
    `Active goal: ${model.activeGoal}`,
    `Profile: ${model.environment.profile}`,
    `LLM: ${model.environment.llmModel} | retryCount=${model.environment.llmRetryCount} | apiKeyConfigured=${model.environment.llmApiKeyConfigured ? 'yes' : 'no'}`,
    `WhatsApp: ${model.environment.whatsappEnabled ? 'enabled' : 'disabled'} (${model.environment.whatsappMode})`,
    `Sessions: ${model.environment.sessionCount} | Messages: ${model.environment.messageCount}`,
    `Semantic memory entries: ${model.environment.semanticMemoryEntries}`,
    `Pending approvals: ${model.environment.pendingApprovals}`,
    `Latest session update: ${model.environment.latestSessionUpdate ?? 'n/a'}`,
    'Constraints:',
    ...(model.constraints.length > 0 ? model.constraints.map((item) => `- ${item}`) : ['- none recorded']),
    'Risks:',
    ...(model.risks.length > 0 ? model.risks.map((item) => `- ${item}`) : ['- no major runtime risks detected']),
    'Next actions:',
    ...model.nextActions.map((item) => `- ${item}`),
  ].join('\n');
}
