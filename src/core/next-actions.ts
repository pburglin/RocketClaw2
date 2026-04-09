import { loadAppConfig } from '../tools/config-store.js';
import { loadApprovals } from '../approval/store.js';

export async function getRecommendedNextActions(): Promise<string[]> {
  const config = await loadAppConfig();
  const approvals = await loadApprovals();
  const actions: string[] = [];

  if (!config.messaging.whatsapp.defaultRecipient) {
    actions.push('Configure a default WhatsApp recipient with `rocketclaw2 whatsapp-config --default-recipient "+15551234567"`.');
  }

  if (config.tools.some((tool) => tool.access === 'disabled')) {
    actions.push('Review disabled tools with `rocketclaw2 tool-policy-summary` and enable only what you truly need.');
  }

  const pending = approvals.filter((item) => item.status === 'pending');
  if (pending.length > 0) {
    actions.push('Review pending approvals with `rocketclaw2 approval-pending`.');
  }

  if (config.yolo.enabled) {
    actions.push('Re-evaluate whether yolo mode should remain enabled. It bypasses normal approval safeguards.');
  }

  if (actions.length === 0) {
    actions.push('System posture looks healthy. Next step: expand real integrations or continue runtime workflow testing.');
  }

  return actions;
}

export function formatRecommendedNextActions(actions: string[]): string {
  return ['Recommended next actions:', ...actions.map((item) => `- ${item}`)].join('\n');
}
