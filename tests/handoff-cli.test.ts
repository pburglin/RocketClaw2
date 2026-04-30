import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('handoff CLI', () => {
  it('creates, lists, and shows persisted handoff artifacts', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-home-'));
    const appRoot = path.join(home, '.rocketclaw2');
    await fs.mkdir(path.join(appRoot, 'harness-runs'), { recursive: true });
    await fs.writeFile(path.join(appRoot, 'harness-runs', 'plan-123.json'), JSON.stringify({
      runId: 'plan-123',
      kind: 'plan',
      ok: true,
      approvalStatus: 'approved',
      workspace: '/tmp/demo',
      task: 'Demo task',
      validateCommand: 'npm test',
    }, null, 2));
    await fs.writeFile(path.join(appRoot, 'approvals.json'), JSON.stringify([{
      id: 'approval-123',
      kind: 'harness-plan',
      target: 'plan-123',
      detail: 'Review demo plan',
      status: 'pending',
      createdAt: '2026-04-25T14:00:00.000Z',
    }], null, 2));

    const env = { ...process.env, HOME: home };

    const created = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', '--llm-retry-count', '8', 'handoff-create', '--preset', 'architect', '--notes', 'Hand off after plan review', '--related-harness-id', 'plan-123', '--related-approval-id', 'approval-123', '--json'], {
      cwd: process.cwd(),
      env,
    });
    const artifact = JSON.parse(created.stdout);

    const listed = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'handoff-list'], {
      cwd: process.cwd(),
      env,
    });
    const shown = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'handoff-show', '--id', String(artifact.id)], {
      cwd: process.cwd(),
      env,
    });

    expect(artifact.environment.llmRetryCount).toBe(8);
    expect(artifact.handoff.owner).toBe('architect');
    expect(artifact.related.harness.runId).toBe('plan-123');
    expect(artifact.related.approval.id).toBe('approval-123');
    expect(listed.stdout).toContain(String(artifact.id));
    expect(listed.stdout).toContain('owner=architect');
    expect(listed.stdout).toContain('next=rocketclaw2 approval-pending');
    expect(shown.stdout).toContain('RocketClaw2 Handoff Artifact');
    expect(shown.stdout).toContain('Owner: architect');
    expect(shown.stdout).toContain('Related approval: approval-123');
    expect(shown.stdout).toContain('Suggested follow-up commands:');
    expect(shown.stdout).toContain('rocketclaw2 approval-pending');
    expect(shown.stdout).toContain('retryCount=8');

    await fs.rm(home, { recursive: true, force: true });
  }, 20000);
});
