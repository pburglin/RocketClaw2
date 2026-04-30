import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import YAML from 'yaml';

const execFileAsync = promisify(execFile);

describe('team-role-template CLI', () => {
  it('prints a scoped reviewer template', async () => {
    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      'team-role-template',
      '--role', 'qa',
      '--goal', 'Validate the release handoff flow',
      '--scope', 'Review only release handoff UX and validation posture.',
      '--input', 'handoff-show output', 'CHANGELOG.md',
      '--deliverable', 'A concise QA verdict',
    ], {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    expect(stdout).toContain('RocketClaw2 Team Role Template');
    expect(stdout).toContain('Role: Reviewer/QA');
    expect(stdout).toContain('Goal: Validate the release handoff flow');
    expect(stdout).toContain('Inputs: handoff-show output; CHANGELOG.md');
    expect(stdout).toContain('A concise QA verdict');
  }, 15000);

  it('can derive a reviewer template from a saved handoff artifact', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-team-role-template-home-'));
    const root = path.join(home, '.rocketclaw2');
    await fs.mkdir(path.join(root, 'handoffs'), { recursive: true });
    await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({ messaging: { whatsapp: { enabled: false, mode: 'mock' } } }));
    await fs.writeFile(path.join(root, 'handoffs', 'handoff-123.json'), JSON.stringify({
      id: 'handoff-123',
      createdAt: '2026-04-25T20:00:00.000Z',
      activeGoal: 'Validate the release handoff flow',
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
      related: { approval: { id: 'approval-123', kind: 'harness-plan', status: 'pending', target: 'plan-123' } },
      constraints: ['Review release handoff UX only.'],
      risks: ['Need to preserve packaging checks.'],
      nextActions: ['Review pending approvals with `rocketclaw2 approval-pending`.'],
      source: {
        worldModelCommand: 'rocketclaw2 world-model',
        workspaceStatusCommand: 'rocketclaw2 workspace-status',
        systemSummaryCommand: 'rocketclaw2 system-summary',
      },
      handoffChain: [],
    }, null, 2));

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      'team-role-template',
      '--role', 'reviewer',
      '--from-handoff-id', 'handoff-123',
      '--input', 'CHANGELOG.md',
    ], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: home },
    });

    expect(stdout).toContain('Role: Reviewer/QA');
    expect(stdout).toContain('Goal: Validate the release handoff flow');
    expect(stdout).toContain('Review release handoff UX only.');
    expect(stdout).toContain('Handoff artifact handoff-123');
    expect(stdout).toContain('CHANGELOG.md');

    await fs.rm(home, { recursive: true, force: true });
  }, 15000);
});
