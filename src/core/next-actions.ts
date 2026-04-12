import { loadAppConfig } from '../tools/config-store.js';
import { loadApprovals } from '../approval/store.js';
import { loadWhatsAppSession } from '../messaging/whatsapp-session.js';
import { listSessions } from '../sessions/store.js';

export async function getRecommendedNextActions(root?: string): Promise<string[]> {
  const [config, approvals, whatsappSession, sessions] = await Promise.all([
    loadAppConfig(root),
    loadApprovals(root),
    loadWhatsAppSession(root),
    listSessions(root),
  ]);
  const actions: string[] = [];

  if (!config.messaging.whatsapp.defaultRecipient) {
    actions.push('Configure a default WhatsApp recipient with `rocketclaw2 whatsapp-config --default-recipient "+15551234567"`.');
  }

  if (config.messaging.whatsapp.mode === 'session' && !whatsappSession?.token) {
    actions.push('WhatsApp session mode is enabled but no local session is configured. Run `rocketclaw2 whatsapp-qr` or `rocketclaw2 whatsapp-session --set-token <token>`.');
  }

  if (config.messaging.whatsapp.mode === 'session' && config.messaging.whatsapp.selfChatOnly !== false && !config.messaging.whatsapp.ownPhoneNumber) {
    actions.push('WhatsApp self-chat-only session mode needs an explicit identity. Run `rocketclaw2 whatsapp-config --own-phone-number "+15551234567"`.');
  }

  if (sessions.length === 0) {
    actions.push('Create an initial session with `rocketclaw2 session-create --title "First Session"` to start exercising runtime workflows.');
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
