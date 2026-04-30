import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import YAML from 'yaml';

const execFileAsync = promisify(execFile);

describe('memory-list CLI', () => {
  it('filters semantic memory by query and limits highest-salience matches first', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-memory-list-home-'));
    const root = path.join(home, '.rocketclaw2');
    await fs.mkdir(path.join(root, 'memory'), { recursive: true });
    await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({ messaging: { whatsapp: { enabled: false, mode: 'mock' } } }));
    await fs.writeFile(path.join(root, 'memory', 'semantic-memory.json'), JSON.stringify([
      { id: 'm1', text: 'Pedro prefers short WhatsApp updates', salience: 40, createdAt: '2026-04-29T10:00:00.000Z', tags: ['preference', 'whatsapp'] },
      { id: 'm2', text: 'Pedro prefers short status notes during meetings', salience: 80, createdAt: '2026-04-29T11:00:00.000Z', tags: ['preference', 'meetings'] },
      { id: 'm3', text: 'Architecture review every Friday', salience: 60, createdAt: '2026-04-29T12:00:00.000Z', tags: ['calendar'] },
    ], null, 2));

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      'memory-list',
      '--query', 'prefer',
      '--limit', '1',
    ], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: home },
    });

    expect(stdout).toContain('m2');
    expect(stdout).toContain('short status notes');
    expect(stdout).not.toContain('m1');
    expect(stdout).not.toContain('m3');

    await fs.rm(home, { recursive: true, force: true });
  }, 15000);
});
