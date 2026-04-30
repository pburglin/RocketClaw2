import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('llm-stats CLI', () => {
  it('prints session-scoped LLM performance stats from telemetry events', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-telemetry-'));
    const telemetryPath = path.join(tmp, 'telemetry.json');
    await fs.writeFile(telemetryPath, JSON.stringify([
      {
        id: '1',
        timestamp: '2026-04-25T22:00:00.000Z',
        sessionId: 'chat-123',
        channel: 'cli',
        eventType: 'llm_request',
        ok: true,
      },
      {
        id: '2',
        timestamp: '2026-04-25T22:00:02.000Z',
        sessionId: 'chat-123',
        channel: 'cli',
        eventType: 'llm_response',
        durationMs: 2000,
        metadata: { promptTokens: 20, completionTokens: 40, totalTokens: 60, tokensPerSecond: 20 },
        ok: true,
      },
      {
        id: '3',
        timestamp: '2026-04-25T22:00:05.000Z',
        sessionId: 'chat-123',
        channel: 'cli',
        eventType: 'llm_error',
        error: 'timeout',
        ok: false,
      },
    ], null, 2));

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      'llm-stats',
      '--session-id', 'chat-123',
      '--period', '30',
    ], {
      cwd: process.cwd(),
      env: { ...process.env, ROCKETCLAW2_TELEMETRY_PATH: telemetryPath },
    });

    expect(stdout).toContain('LLM Performance Stats');
    expect(stdout).toContain('Session ID:  chat-123');
    expect(stdout).toContain('Successful:  1');
    expect(stdout).toContain('Errors:      1');
    expect(stdout).toContain('Tokens/sec:  20.00');
    expect(stdout).toContain('Avg compl.:  40.0 tokens/response');

    await fs.rm(tmp, { recursive: true, force: true });
  }, 15000);
});
