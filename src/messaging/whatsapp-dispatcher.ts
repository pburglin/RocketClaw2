import { getRecommendedNextActions } from '../core/next-actions.js';
import { buildWorkspaceStatus, formatWorkspaceStatus } from '../core/workspace-status.js';
import type { WhatsAppInboundEvent } from './whatsapp-listener.js';

export type WhatsAppDispatchResult = {
  matched: boolean;
  command?: string;
  replyText?: string;
};

export async function dispatchWhatsAppInbound(event: WhatsAppInboundEvent): Promise<WhatsAppDispatchResult> {
  const text = event.text.trim();

  if (/^(status|workspace-status)$/i.test(text)) {
    const status = await buildWorkspaceStatus();
    return {
      matched: true,
      command: 'workspace-status',
      replyText: formatWorkspaceStatus(status),
    };
  }

  if (/^(next|next-actions)$/i.test(text)) {
    const actions = await getRecommendedNextActions();
    return {
      matched: true,
      command: 'next-actions',
      replyText: actions.length > 0 ? actions.map((item) => `- ${item}`).join('\n') : 'No recommended next actions.',
    };
  }

  return { matched: false };
}
