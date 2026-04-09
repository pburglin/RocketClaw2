import { loadAppConfig } from '../tools/config-store.js';
import { listSessions } from '../sessions/store.js';
import { loadApprovals } from '../approval/store.js';
import { loadSemanticMemory } from '../memory/semantic-store.js';
import { getRecommendedNextActions } from './next-actions.js';

export async function buildWorkspaceStatus() {
  const [config, sessions, approvals, memory, nextActions] = await Promise.all([
    loadAppConfig(),
    listSessions(),
    loadApprovals(),
    loadSemanticMemory(),
    getRecommendedNextActions(),
  ]);

  return {
    profile: config.profile,
    yoloEnabled: config.yolo.enabled,
    whatsappEnabled: config.messaging.whatsapp.enabled,
    sessions: sessions.length,
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
    `WhatsApp: ${status.whatsappEnabled ? 'enabled' : 'disabled'}`,
    `Sessions: ${status.sessions}`,
    `Pending approvals: ${status.pendingApprovals}`,
    `Semantic memory entries: ${status.semanticMemoryEntries}`,
    'Next actions:',
    ...status.nextActions.map((item) => `- ${item}`),
  ].join('\n');
}
