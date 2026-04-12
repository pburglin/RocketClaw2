import { loadAppConfig } from '../tools/config-store.js';
import { loadApprovals } from '../approval/store.js';
import { loadSemanticMemory } from '../memory/semantic-store.js';
import { getSessionStats } from '../sessions/stats.js';
import { loadWhatsAppSession } from '../messaging/whatsapp-session.js';
import { getRecommendedNextActions } from './next-actions.js';

export async function buildWorkspaceStatus(root?: string) {
  const [config, sessionStats, approvals, memory, nextActions, whatsappSession] = await Promise.all([
    loadAppConfig(root),
    getSessionStats(root),
    loadApprovals(root),
    loadSemanticMemory(root),
    getRecommendedNextActions(root),
    loadWhatsAppSession(root),
  ]);

  return {
    profile: config.profile,
    yoloEnabled: config.yolo.enabled,
    whatsappEnabled: config.messaging.whatsapp.enabled,
    whatsappMode: config.messaging.whatsapp.mode,
    whatsappDefaultRecipient: config.messaging.whatsapp.defaultRecipient ?? null,
    whatsappSelfChatOnly: config.messaging.whatsapp.selfChatOnly,
    whatsappConfiguredOwnPhoneNumber: config.messaging.whatsapp.ownPhoneNumber ?? null,
    whatsappSessionConfigured: Boolean(whatsappSession?.token),
    whatsappSessionPhoneNumber: whatsappSession?.phoneNumber ?? null,
    whatsappSessionLastUsedAt: whatsappSession?.lastUsedAt ?? null,
    sessionCount: sessionStats.sessionCount,
    messageCount: sessionStats.messageCount,
    latestSessionUpdate: sessionStats.latestUpdatedAt,
    pendingApprovals: approvals.filter((item) => item.status === 'pending').length,
    semanticMemoryEntries: memory.length,
    nextActions,
  };
}

export function formatWorkspaceStatus(status: Awaited<ReturnType<typeof buildWorkspaceStatus>>): string {
  return [
    'RocketClaw2 Workspace Status',
    `Profile: ${status.profile}`,
    `Yolo: ${status.yoloEnabled ? 'enabled' : 'disabled'}`,
    `WhatsApp: ${status.whatsappEnabled ? 'enabled' : 'disabled'} (${status.whatsappMode})`,
    `WhatsApp default recipient: ${status.whatsappDefaultRecipient ?? 'n/a'}`,
    `WhatsApp self-chat-only: ${status.whatsappSelfChatOnly ? 'yes' : 'no'}`,
    `WhatsApp configured own phone number: ${status.whatsappConfiguredOwnPhoneNumber ?? 'n/a'}`,
    `WhatsApp session configured: ${status.whatsappSessionConfigured ? 'yes' : 'no'}`,
    `WhatsApp session phone number: ${status.whatsappSessionPhoneNumber ?? 'n/a'}`,
    `WhatsApp session last used: ${status.whatsappSessionLastUsedAt ?? 'never'}`,
    `Sessions: ${status.sessionCount}`,
    `Messages: ${status.messageCount}`,
    `Latest session update: ${status.latestSessionUpdate ?? 'n/a'}`,
    `Pending approvals: ${status.pendingApprovals}`,
    `Semantic memory entries: ${status.semanticMemoryEntries}`,
    'Next actions:',
    ...status.nextActions.map((item) => `- ${item}`),
  ].join('\n');
}
