import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import YAML from 'yaml';

const execFileAsync = promisify(execFile);

describe('team-orchestrate CLI', () => {
  it('prints a staged workflow from a direct goal', async () => {
    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      'team-orchestrate',
      '--goal', 'Ship a scoped runtime ergonomics improvement',
      '--input', 'README.md', 'docs/USAGE.md',
    ], {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    expect(stdout).toContain('RocketClaw2 Multi-Agent Team Workflow');
    expect(stdout).toContain('1. PM (pm)');
    expect(stdout).toContain('4. REVIEWER (reviewer)');
    expect(stdout).toContain('handoff-create --preset implementer');
    expect(stdout).not.toContain('Saved handoff:');
  }, 15000);

  it('can derive a staged workflow from a saved handoff artifact', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-team-orchestrate-home-'));
    const root = path.join(home, '.rocketclaw2');
    await fs.mkdir(path.join(root, 'handoffs'), { recursive: true });
    await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({ messaging: { whatsapp: { enabled: false, mode: 'mock' } } }));
    await fs.writeFile(path.join(root, 'handoffs', 'handoff-456.json'), JSON.stringify({
      id: 'handoff-456',
      createdAt: '2026-04-25T20:00:00.000Z',
      activeGoal: 'Coordinate a release handoff',
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
      handoffChain: [],
      source: {
        worldModelCommand: 'rocketclaw2 world-model',
        workspaceStatusCommand: 'rocketclaw2 workspace-status',
        systemSummaryCommand: 'rocketclaw2 system-summary',
      },
    }, null, 2));

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      'team-orchestrate',
      '--from-handoff-id', 'handoff-456',
      '--input', 'CHANGELOG.md',
    ], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: home },
    });

    expect(stdout).toContain('Goal: Coordinate a release handoff');
    expect(stdout).toContain('Handoff artifact handoff-456');
    expect(stdout).toContain('CHANGELOG.md');

    await fs.rm(home, { recursive: true, force: true });
  }, 15000);
});
