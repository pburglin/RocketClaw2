import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import YAML from 'yaml';

const execFileAsync = promisify(execFile);

describe('handoff chain CLI', () => {
  it('creates a chain of handoffs and can retrieve it', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-handoff-chain-home-'));
    const root = path.join(home, '.rocketclaw2');
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({ messaging: { whatsapp: { enabled: false, mode: 'mock' } } }));

    const makeHandoff = async (preset?: string, parent?: string) => {
      const args = ['src/cli.ts', 'handoff-create', '--preset', preset ?? 'architect', '--json'];
      if (parent) args.push('--parent-handoff-id', parent);
      const { stdout } = await execFileAsync('./node_modules/.bin/tsx', args, {
        cwd: process.cwd(),
        env: { ...process.env, HOME: home },
      });
      return JSON.parse(stdout);
    };

    const rootHandoff = await makeHandoff('pm');
    expect(rootHandoff.parentHandoffId).toBeUndefined();
    expect(rootHandoff.handoffChain).toHaveLength(0);

    const child1 = await makeHandoff('architect', rootHandoff.id);
    expect(child1.parentHandoffId).toBe(rootHandoff.id);
    expect(child1.handoffChain).toEqual([rootHandoff.id]);

    const child2 = await makeHandoff('implementer', child1.id);
    expect(child2.parentHandoffId).toBe(child1.id);
    expect(child2.handoffChain).toEqual([rootHandoff.id, child1.id]);

    const { stdout: chainStdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts', 'handoff-chain', '--id', child2.id,
    ], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: home },
    });

    expect(chainStdout).toContain(`Handoff chain (3 artifact`);
    expect(chainStdout).toContain(rootHandoff.id);
    expect(chainStdout).toContain(child1.id);
    expect(chainStdout).toContain(child2.id);

    // leaf artifact should appear somewhere in the chain
    expect(chainStdout).toContain(child2.id);

    await fs.rm(home, { recursive: true, force: true });
  }, 20000);

  it('lists handoffs with chain depth', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-handoff-list-chain-home-'));
    const root = path.join(home, '.rocketclaw2');
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({ messaging: { whatsapp: { enabled: false, mode: 'mock' } } }));

    const makeHandoff = async (preset: string, parent?: string) => {
      const args = ['src/cli.ts', 'handoff-create', '--preset', preset, '--json'];
      if (parent) args.push('--parent-handoff-id', parent);
      const { stdout } = await execFileAsync('./node_modules/.bin/tsx', args, {
        cwd: process.cwd(),
        env: { ...process.env, HOME: home },
      });
      return JSON.parse(stdout);
    };

    const rootHandoff = await makeHandoff('pm');
    await makeHandoff('architect', rootHandoff.id);

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts', 'handoff-list',
    ], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: home },
    });

    expect(stdout).toContain('depth=0');
    expect(stdout).toContain('depth=1');
    expect(stdout).toContain('[chain 1]');

    await fs.rm(home, { recursive: true, force: true });
  }, 20000);
});
