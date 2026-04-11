import { formatDoctorReport, runDoctorChecks } from '../core/doctor.js';
import { getRecommendedNextActions } from '../core/next-actions.js';
import { buildWorkspaceStatus, formatWorkspaceStatus } from '../core/workspace-status.js';
import { getDefaultProjectRoot } from '../config/app-paths.js';
import type { WhatsAppInboundEvent } from './whatsapp-listener.js';

export type WhatsAppDispatchResult = {
  matched: boolean;
  command?: string;
  replyText?: string;
};

function buildHelpText(): string {
  return [
    'RocketClaw2 WhatsApp commands:',
    '- status',
    '- doctor',
    '- next-actions',
    '- help',
  ].join('\n');
}

export async function dispatchWhatsAppInbound(
  event: WhatsAppInboundEvent,
  root = getDefaultProjectRoot(),
): Promise<WhatsAppDispatchResult> {
  const text = event.text.trim();

  if (/^(help|commands)$/i.test(text)) {
    return {
      matched: true,
      command: 'help',
      replyText: buildHelpText(),
    };
  }

  if (/^(status|workspace-status)$/i.test(text)) {
    const status = await buildWorkspaceStatus(root);
    return {
      matched: true,
      command: 'workspace-status',
      replyText: formatWorkspaceStatus(status),
    };
  }

  if (/^(doctor)$/i.test(text)) {
    const report = await runDoctorChecks(root);
    return {
      matched: true,
      command: 'doctor',
      replyText: formatDoctorReport(report),
    };
  }

  if (/^(next|next-actions)$/i.test(text)) {
    const actions = await getRecommendedNextActions(root);
    return {
      matched: true,
      command: 'next-actions',
      replyText: actions.length > 0 ? actions.map((item) => `- ${item}`).join('\n') : 'No recommended next actions.',
    };
  }

  return { matched: false };
}
