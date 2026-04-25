import { describe, expect, it } from 'vitest';
import { buildRoleTemplate, buildRoleTemplateFromHandoff, formatRoleTemplate, normalizeTeamRole } from '../src/teams/role-templates.js';

describe('team role templates', () => {
  it('builds and formats a scoped architect brief', () => {
    const template = buildRoleTemplate({
      role: 'architect',
      goal: 'Design the release workflow changes',
      scope: 'Touch release workflow design only.',
      inputs: ['Existing CI workflow', 'Release requirements'],
      deliverable: 'A rollout-safe design brief',
    });

    expect(template.role).toBe('architect');
    expect(template.brief).toContain('Role: Architect');
    expect(template.brief).toContain('A rollout-safe design brief');
    expect(formatRoleTemplate(template)).toContain('Checklist:');
    expect(formatRoleTemplate(template)).toContain('Inputs: Existing CI workflow; Release requirements');
  });

  it('can derive a scoped template from a saved handoff artifact', () => {
    const template = buildRoleTemplateFromHandoff({
      role: 'implementer',
      handoff: {
        id: 'handoff-123',
        createdAt: '2026-04-25T20:00:00.000Z',
        activeGoal: 'Ship the release handoff flow',
        environment: {
          profile: 'default',
          llmModel: 'demo-model',
          llmRetryCount: 3,
          llmApiKeyConfigured: true,
          whatsappEnabled: true,
          whatsappMode: 'session',
          sessionCount: 2,
          messageCount: 10,
          semanticMemoryEntries: 4,
          pendingApprovals: 1,
          latestSessionUpdate: '2026-04-25T19:00:00.000Z',
        },
        handoff: { owner: 'architect', notes: 'Keep release scope narrow.' },
        related: { harness: { runId: 'plan-123', kind: 'plan', approvalStatus: 'approved' } },
        constraints: ['Touch release docs and CLI only.'],
        risks: ['Need to preserve packaging checks.'],
        nextActions: ['Approve the plan and execute it.'],
        source: {
          worldModelCommand: 'rocketclaw2 world-model',
          workspaceStatusCommand: 'rocketclaw2 workspace-status',
          systemSummaryCommand: 'rocketclaw2 system-summary',
        },
      },
      extraInputs: ['CHANGELOG.md'],
    });

    expect(template.brief).toContain('Goal: Ship the release handoff flow');
    expect(template.brief).toContain('Touch release docs and CLI only.');
    expect(formatRoleTemplate(template)).toContain('Handoff artifact handoff-123');
    expect(formatRoleTemplate(template)).toContain('CHANGELOG.md');
  });

  it('normalizes qa to reviewer and rejects unknown roles', () => {
    expect(normalizeTeamRole('qa')).toBe('reviewer');
    expect(() => normalizeTeamRole('unknown')).toThrow('Unknown team role');
  });
});
