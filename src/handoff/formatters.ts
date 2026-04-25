import type { HandoffArtifact } from './store.js';

export function getHandoffFollowUpCommands(item: HandoffArtifact): string[] {
  const commands: string[] = [];
  const relatedApproval = item.related.approval;
  const relatedHarness = item.related.harness;

  if (relatedApproval?.status === 'pending') {
    commands.push(`rocketclaw2 approval-pending`);
  }

  if (relatedApproval?.kind === 'harness-plan' && relatedApproval?.status === 'approved' && relatedHarness?.runId) {
    commands.push(`rocketclaw2 harness-run --id ${relatedHarness.runId} --require-approved-plan`);
  } else if (relatedHarness?.kind === 'plan' && relatedHarness?.approvalStatus === 'draft') {
    commands.push(`rocketclaw2 harness-approve --id ${relatedHarness.runId}`);
  } else if (relatedHarness?.kind === 'plan' && relatedHarness?.approvalStatus === 'approved') {
    commands.push(`rocketclaw2 harness-run --id ${relatedHarness.runId} --require-approved-plan`);
  } else if (relatedHarness?.runId && relatedHarness?.ok === false) {
    commands.push(`rocketclaw2 harness-resume --id ${relatedHarness.runId}`);
    commands.push(`rocketclaw2 harness-iterations --id ${relatedHarness.runId} --latest --guidance`);
  } else if (relatedHarness?.runId) {
    commands.push(`rocketclaw2 harness-show --id ${relatedHarness.runId}`);
  }

  commands.push(item.source.worldModelCommand);
  return Array.from(new Set(commands));
}

export function formatHandoffArtifact(item: HandoffArtifact): string {
  return [
    'RocketClaw2 Handoff Artifact',
    `ID: ${item.id}`,
    `Created: ${item.createdAt}`,
    `Active goal: ${item.activeGoal}`,
    `Owner: ${item.handoff.owner ?? 'n/a'}`,
    `Notes: ${item.handoff.notes ?? 'n/a'}`,
    `Profile: ${item.environment.profile}`,
    `LLM: ${item.environment.llmModel} | retryCount=${item.environment.llmRetryCount} | apiKeyConfigured=${item.environment.llmApiKeyConfigured ? 'yes' : 'no'}`,
    `WhatsApp: ${item.environment.whatsappEnabled ? 'enabled' : 'disabled'} (${item.environment.whatsappMode})`,
    `Sessions: ${item.environment.sessionCount} | Messages: ${item.environment.messageCount}`,
    `Semantic memory entries: ${item.environment.semanticMemoryEntries}`,
    `Pending approvals: ${item.environment.pendingApprovals}`,
    `Latest session update: ${item.environment.latestSessionUpdate ?? 'n/a'}`,
    `Related harness: ${item.related.harness ? `${item.related.harness.runId} | kind=${item.related.harness.kind ?? 'n/a'} | ok=${item.related.harness.ok ?? 'n/a'} | approval=${item.related.harness.approvalStatus ?? 'n/a'}` : 'n/a'}`,
    `Related approval: ${item.related.approval ? `${item.related.approval.id} | kind=${item.related.approval.kind} | status=${item.related.approval.status} | target=${item.related.approval.target}` : 'n/a'}`,
    'Constraints:',
    ...(item.constraints.length > 0 ? item.constraints.map((entry) => `- ${entry}`) : ['- none recorded']),
    'Risks:',
    ...(item.risks.length > 0 ? item.risks.map((entry) => `- ${entry}`) : ['- no major runtime risks detected']),
    'Next actions:',
    ...item.nextActions.map((entry) => `- ${entry}`),
    'Suggested follow-up commands:',
    ...getHandoffFollowUpCommands(item).map((command) => `- ${command}`),
    'Source commands:',
    `- ${item.source.worldModelCommand}`,
    `- ${item.source.workspaceStatusCommand}`,
    `- ${item.source.systemSummaryCommand}`,
  ].join('\n');
}

export function formatHandoffList(items: HandoffArtifact[]): string {
  if (items.length === 0) return 'No handoff artifacts found.';
  return items
    .map((item) => `${item.id} | ${item.createdAt} | owner=${item.handoff.owner ?? 'n/a'} | ${item.activeGoal} | next=${getHandoffFollowUpCommands(item)[0] ?? item.nextActions[0] ?? 'n/a'}`)
    .join('\n');
}
