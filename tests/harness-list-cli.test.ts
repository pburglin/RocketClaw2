import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import YAML from 'yaml';

const execFileAsync = promisify(execFile);

describe('harness-list CLI', () => {
  it('filters artifacts by source handoff id', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-harness-list-home-'));
    const root = path.join(home, '.rocketclaw2');
    await fs.mkdir(path.join(root, 'harness-runs'), { recursive: true });
    await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({ messaging: { whatsapp: { enabled: false, mode: 'mock' } } }));
    await fs.writeFile(path.join(root, 'harness-runs', 'plan-1.json'), JSON.stringify({
      kind: 'plan',
      runId: 'plan-1',
      ok: true,
      approvalStatus: 'draft',
      workspace: '/tmp/demo',
      task: 'planned from handoff 1',
      validateCommand: 'npm test',
      planText: 'Summary',
      sourceHandoffId: 'handoff-1',
    }, null, 2));
    await fs.writeFile(path.join(root, 'harness-runs', 'run-2.json'), JSON.stringify({
      runId: 'run-2',
      ok: false,
      workspace: '/tmp/demo',
      task: 'run from handoff 2',
      validateCommand: 'npm test',
      iterations: 1,
      lastGuidance: 'retry',
      lastValidationStdout: '',
      lastValidationStderr: 'boom',
      sourceHandoffId: 'handoff-2',
    }, null, 2));

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      'harness-list',
      '--source-handoff-id', 'handoff-1',
    ], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: home },
    });

    expect(stdout).toContain('plan-1');
    expect(stdout).toContain('sourceHandoff=handoff-1');
    expect(stdout).not.toContain('run-2');

    await fs.rm(home, { recursive: true, force: true });
  }, 15000);

  it('filters artifacts by evaluation decision', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-harness-list-eval-home-'));
    const root = path.join(home, '.rocketclaw2');
    await fs.mkdir(path.join(root, 'harness-runs'), { recursive: true });
    await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({ messaging: { whatsapp: { enabled: false, mode: 'mock' } } }));
    await fs.writeFile(path.join(root, 'harness-runs', 'run-1.json'), JSON.stringify({
      runId: 'run-1',
      ok: true,
      evaluationDecision: 'accepted',
      workspace: '/tmp/demo',
      task: 'accepted run',
      validateCommand: 'npm test',
      iterations: 1,
      lastGuidance: 'done',
      lastValidationStdout: 'ok',
      lastValidationStderr: '',
    }, null, 2));
    await fs.writeFile(path.join(root, 'harness-runs', 'run-2.json'), JSON.stringify({
      runId: 'run-2',
      ok: false,
      evaluationDecision: 'needs-review',
      workspace: '/tmp/demo',
      task: 'needs review run',
      validateCommand: 'npm test',
      iterations: 1,
      lastGuidance: 'retry',
      lastValidationStdout: '',
      lastValidationStderr: 'boom',
    }, null, 2));

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      'harness-list',
      '--evaluation', 'accepted',
    ], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: home },
    });

    expect(stdout).toContain('run-1');
    expect(stdout).toContain('evaluation=accepted');
    expect(stdout).not.toContain('run-2');

    await fs.rm(home, { recursive: true, force: true });
  }, 15000);

  it('filters artifacts by any ancestor in the source handoff chain', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-harness-list-chain-home-'));
    const root = path.join(home, '.rocketclaw2');
    await fs.mkdir(path.join(root, 'harness-runs'), { recursive: true });
    await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({ messaging: { whatsapp: { enabled: false, mode: 'mock' } } }));
    await fs.writeFile(path.join(root, 'harness-runs', 'plan-1.json'), JSON.stringify({
      kind: 'plan',
      runId: 'plan-1',
      ok: true,
      approvalStatus: 'approved',
      workspace: '/tmp/demo',
      task: 'planned from chain',
      validateCommand: 'npm test',
      planText: 'Summary',
      sourceHandoffId: 'handoff-9',
      sourceHandoffChain: ['handoff-1', 'handoff-4', 'handoff-9'],
    }, null, 2));
    await fs.writeFile(path.join(root, 'harness-runs', 'run-2.json'), JSON.stringify({
      runId: 'run-2',
      ok: true,
      workspace: '/tmp/demo',
      task: 'unrelated chain',
      validateCommand: 'npm test',
      iterations: 1,
      lastGuidance: 'done',
      lastValidationStdout: 'ok',
      lastValidationStderr: '',
      sourceHandoffId: 'handoff-20',
      sourceHandoffChain: ['handoff-20'],
    }, null, 2));

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      'harness-list',
      '--source-handoff-any', 'handoff-4',
    ], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: home },
    });

    expect(stdout).toContain('plan-1');
    expect(stdout).not.toContain('run-2');

    await fs.rm(home, { recursive: true, force: true });
  }, 15000);
});
