import { describe, expect, it } from 'vitest';
import { formatWorkspaceStatus } from '../src/core/workspace-status.js';

describe('workspace status', () => {
  it('formats a compact workspace dashboard view', () => {
    const text = formatWorkspaceStatus({
      profile: 'default',
      yoloEnabled: false,
      whatsappEnabled: true,
      sessions: 3,
      pendingApprovals: 1,
      semanticMemoryEntries: 4,
      nextActions: ['Do one thing'],
    });
    expect(text).toContain('RocketClaw2 Workspace Status');
    expect(text).toContain('Pending approvals: 1');
  });
});
