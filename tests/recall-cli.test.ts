import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import YAML from 'yaml';

const execFileAsync = promisify(execFile);

describe('recall CLI', () => {
  it('limits filtered recall results', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-recall-cli-home-'));
    const root = path.join(home, '.rocketclaw2');
    await fs.mkdir(path.join(root, 'memory'), { recursive: true });
    await fs.mkdir(path.join(root, 'sessions'), { recursive: true });
    await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({ messaging: { whatsapp: { enabled: false, mode: 'mock' } } }));
    await fs.writeFile(path.join(root, 'memory', 'semantic-memory.json'), JSON.stringify([
      { id: 'm1', text: 'Pedro prefers WhatsApp updates', salience: 80, createdAt: '2026-04-29T10:00:00.000Z', tags: ['preference'] },
      { id: 'm2', text: 'WhatsApp briefing goes out before meetings', salience: 50, createdAt: '2026-04-29T11:00:00.000Z', tags: ['briefing'] }
    ], null, 2));

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      'recall',
      '--query', 'WhatsApp',
      '--kind', 'semantic',
      '--limit', '1',
    ], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: home },
    });

    expect(stdout).toContain('Pedro prefers WhatsApp updates');
    expect(stdout).not.toContain('briefing goes out before meetings');

    await fs.rm(home, { recursive: true, force: true });
  }, 15000);
});
