import type { AppConfig } from './load-config.js';

export function buildSystemSummary(config: AppConfig) {
  return {
    profile: config.profile,
    yolo: config.yolo,
    messaging: config.messaging,
    tools: {
      total: config.tools.length,
      disabled: config.tools.filter((tool) => tool.access === 'disabled').length,
      readOnly: config.tools.filter((tool) => tool.access === 'read-only').length,
      guardedWrite: config.tools.filter((tool) => tool.access === 'guarded-write').length,
      fullAccess: config.tools.filter((tool) => tool.access === 'full-access').length,
      approvedOverrides: config.tools.filter((tool) => tool.approvedOverride).length,
    },
    recallScoring: config.recallScoring,
  };
}

export function formatSystemSummary(summary: ReturnType<typeof buildSystemSummary>): string {
  return [
    `Profile: ${summary.profile}`,
    `Yolo mode: ${summary.yolo.enabled ? 'enabled' : 'disabled'}${summary.yolo.warn ? ' (warn)' : ''}`,
    `WhatsApp: ${summary.messaging.whatsapp.enabled ? 'enabled' : 'disabled'} | mode=${summary.messaging.whatsapp.mode}`,
    `Tools total: ${summary.tools.total}`,
    `Disabled: ${summary.tools.disabled}`,
    `Read-only: ${summary.tools.readOnly}`,
    `Guarded-write: ${summary.tools.guardedWrite}`,
    `Full-access: ${summary.tools.fullAccess}`,
    `Approved overrides: ${summary.tools.approvedOverrides}`,
    `Recall scoring: salience x${summary.recallScoring.sessionSalienceMultiplier}, duplicate semantic bonus=${summary.recallScoring.duplicateSemanticPriorityBonus}, diversity penalty=${summary.recallScoring.diversityPenaltyPerBucketHit}`,
  ].join('\n');
}
