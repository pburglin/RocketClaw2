import { loadAppConfig } from '../tools/config-store.js';
import { loadApprovals } from '../approval/store.js';
import { loadWhatsAppSession } from '../messaging/whatsapp-session.js';
import { getSessionStats } from '../sessions/stats.js';

export type DoctorReport = {
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
};

export async function runDoctorChecks(root?: string): Promise<DoctorReport> {
  const [config, approvals, whatsappSession, sessionStats] = await Promise.all([
    loadAppConfig(root),
    loadApprovals(root),
    loadWhatsAppSession(root),
    getSessionStats(root),
  ]);

  const selfChatNeedsOwnNumber = config.messaging.whatsapp.mode === 'session' && config.messaging.whatsapp.selfChatOnly !== false;

  const checks = [
    {
      name: 'profile',
      ok: Boolean(config.profile),
      detail: `Profile: ${config.profile}`,
    },
    {
      name: 'whatsapp-config',
      ok: config.messaging.whatsapp.enabled ? Boolean(config.messaging.whatsapp.mode) : true,
      detail: `WhatsApp enabled=${config.messaging.whatsapp.enabled}, mode=${config.messaging.whatsapp.mode}`,
    },
    {
      name: 'whatsapp-session-readiness',
      ok: config.messaging.whatsapp.mode !== 'session' || Boolean(whatsappSession?.token),
      detail: config.messaging.whatsapp.mode === 'session'
        ? whatsappSession?.token
          ? `Session configured for ${whatsappSession.phoneNumber ?? 'unknown'}; lastUsed=${whatsappSession.lastUsedAt ?? 'never'}`
          : 'Session mode enabled but no local WhatsApp session is configured'
        : 'Session mode not enabled',
    },
    {
      name: 'whatsapp-self-chat-identity',
      ok: !selfChatNeedsOwnNumber || Boolean(config.messaging.whatsapp.ownPhoneNumber),
      detail: selfChatNeedsOwnNumber
        ? config.messaging.whatsapp.ownPhoneNumber
          ? `Self-chat-only identity configured for ${config.messaging.whatsapp.ownPhoneNumber}`
          : 'Self-chat-only session mode is enabled but ownPhoneNumber is not configured'
        : 'Self-chat-only identity not required',
    },
    {
      name: 'session-activity',
      ok: sessionStats.sessionCount > 0,
      detail: `Sessions=${sessionStats.sessionCount}, messages=${sessionStats.messageCount}, latest=${sessionStats.latestUpdatedAt ?? 'n/a'}`,
    },
    {
      name: 'tool-policies',
      ok: config.tools.length > 0,
      detail: `Configured tool policies: ${config.tools.length}`,
    },
    {
      name: 'yolo-warning',
      ok: !config.yolo.enabled || config.yolo.warn,
      detail: config.yolo.enabled
        ? `Yolo mode enabled with warn=${config.yolo.warn}`
        : 'Yolo mode disabled',
    },
    {
      name: 'pending-approvals',
      ok: true,
      detail: `Pending approvals: ${approvals.filter((item) => item.status === 'pending').length}`,
    },
  ];

  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}

export function formatDoctorReport(report: DoctorReport): string {
  return [
    `Doctor status: ${report.ok ? 'ok' : 'attention-needed'}`,
    ...report.checks.map((check) => `${check.ok ? 'OK' : 'WARN'} | ${check.name} | ${check.detail}`),
  ].join('\n');
}
