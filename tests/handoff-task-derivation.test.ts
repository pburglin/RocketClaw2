import { describe, expect, it } from 'vitest';
import { deriveTaskFromHandoff } from '../src/handoff/task-derivation.js';

describe('deriveTaskFromHandoff', () => {
  it('builds an execution-ready task description from a saved handoff', () => {
    const task = deriveTaskFromHandoff({
      id: 'handoff-1',
      createdAt: '2026-04-29T18:00:00.000Z',
      activeGoal: 'Ship the release handoff flow',
      environment: {
        profile: 'default',
        llmModel: 'demo-model',
        llmRetryCount: 3,
        llmApiKeyConfigured: true,
        whatsappEnabled: false,
        whatsappMode: 'mock',
        sessionCount: 0,
        messageCount: 0,
        semanticMemoryEntries: 0,
        pendingApprovals: 0,
        latestSessionUpdate: null,
      },
      handoff: {
        owner: 'implementer',
        notes: 'Apply the scoped change and preserve current validation posture.',
      },
      related: {},
      parentHandoffId: 'handoff-0',
      handoffChain: ['handoff-0'],
      constraints: ['Touch only the CLI flow.'],
      risks: ['Could break harness approval UX.'],
      nextActions: ['Run focused tests before merge.'],
      source: {
        worldModelCommand: 'rocketclaw2 world-model',
        workspaceStatusCommand: 'rocketclaw2 workspace-status',
        systemSummaryCommand: 'rocketclaw2 system-summary',
      },
    });

    expect(task).toContain('Continue work from handoff artifact handoff-1.');
    expect(task).toContain('Primary goal: Ship the release handoff flow');
    expect(task).toContain('Current owner/stage: implementer');
    expect(task).toContain('Handoff notes: Apply the scoped change and preserve current validation posture.');
    expect(task).toContain('Constraints:');
    expect(task).toContain('Known risks:');
    expect(task).toContain('Suggested next actions:');
    expect(task).toContain('Prior handoff lineage: handoff-0 -> handoff-1');
  });
});
