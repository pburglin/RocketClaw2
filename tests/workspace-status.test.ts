import { describe, expect, it } from 'vitest';
import { formatWorkspaceStatus } from '../src/core/workspace-status.js';

describe('workspace status', () => {
  it('formats a compact workspace dashboard view', () => {
    const text = formatWorkspaceStatus({
      profile: 'default',
      yoloEnabled: false,
      whatsappEnabled: true,
      whatsappMode: 'session',
      whatsappDefaultRecipient: '+15551234567',
      whatsappSessionConfigured: true,
      whatsappSessionPhoneNumber: '+15557654321',
      whatsappSessionLastUsedAt: '2026-04-10T20:05:00.000Z',
      sessionCount: 3,
      messageCount: 12,
      latestSessionUpdate: '2026-04-10T20:10:00.000Z',
      pendingApprovals: 1,
      semanticMemoryEntries: 4,
      nextActions: ['Do one thing'],
    });
    expect(text).toContain('RocketClaw2 Workspace Status');
    expect(text).toContain('WhatsApp: enabled (session)');
    expect(text).toContain('Messages: 12');
    expect(text).toContain('Pending approvals: 1');
  });
});
