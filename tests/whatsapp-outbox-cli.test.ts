import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('whatsapp-outbox CLI', () => {
  it('prints persisted native-session outbound history', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-cli-wa-outbox-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(path.join(appRoot, 'state'), { recursive: true });
    await fs.writeFile(
      path.join(appRoot, 'state', 'whatsapp-native-outbox.json'),
      JSON.stringify([
        {
          id: 'out-1',
          from: '+15551234567',
          to: '+15557654321',
          text: 'hello native',
          transport: 'native-session',
          createdAt: '2026-04-11T10:00:00.000Z'
        }
      ], null, 2),
    );

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'whatsapp-outbox'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });

    expect(stdout).toContain('2026-04-11T10:00:00.000Z | +15551234567 -> +15557654321 | hello native');

    await fs.rm(homeRoot, { recursive: true, force: true });
  }, 15000);
});
