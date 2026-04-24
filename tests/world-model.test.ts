import { describe, expect, it } from 'vitest';
import { formatWorldModel } from '../src/core/world-model.js';

describe('world model', () => {
  it('formats a structured planning snapshot', () => {
    const text = formatWorldModel({
      activeGoal: 'Review pending approvals',
      environment: {
        profile: 'default',
        yoloEnabled: false,
        llmModel: 'demo-model',
        llmApiKeyConfigured: true,
        whatsappEnabled: true,
        whatsappMode: 'session',
        sessionCount: 3,
        messageCount: 12,
        semanticMemoryEntries: 4,
        pendingApprovals: 1,
        latestSessionUpdate: '2026-04-10T20:10:00.000Z',
      },
      constraints: ['WhatsApp self-chat-only posture is enabled'],
      risks: ['1 approval item(s) still pending'],
      nextActions: ['Review pending approvals with `rocketclaw2 approval-pending`.'],
    });

    expect(text).toContain('RocketClaw2 World Model');
    expect(text).toContain('Active goal: Review pending approvals');
    expect(text).toContain('Constraints:');
    expect(text).toContain('Risks:');
    expect(text).toContain('Next actions:');
  });
});
