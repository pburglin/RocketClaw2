import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import YAML from 'yaml';

const execFileAsync = promisify(execFile);

describe('karpathian-loop CLI', () => {
  it('prints a JSON scorecard using current and previous telemetry windows', async () => {
    const home = path.join(os.tmpdir(), `rocketclaw2-karpathian-home-${Date.now()}`);
    const root = path.join(home, '.rocketclaw2');
    const telemetryPath = path.join(os.tmpdir(), `rocketclaw2-karpathian-telemetry-${Date.now()}.json`);
    const now = Date.now();
    const day = 86400 * 1000;

    await fs.mkdir(path.join(root, 'harness-runs'), { recursive: true });
    await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({ messaging: { whatsapp: { enabled: false, mode: 'mock' } } }));
    await fs.writeFile(
      telemetryPath,
      JSON.stringify([
        {
          id: 'current-ok',
          timestamp: new Date(now - day).toISOString(),
          channel: 'cli',
          eventType: 'command_ok',
          command: 'doctor',
          ok: true,
          durationMs: 12,
        },
        {
          id: 'current-error',
          timestamp: new Date(now - day).toISOString(),
          channel: 'cli',
          eventType: 'command_error',
          command: 'send',
          ok: false,
          durationMs: 20,
        },
        {
          id: 'previous-error-1',
          timestamp: new Date(now - 8 * day).toISOString(),
          channel: 'cli',
          eventType: 'command_error',
          command: 'send',
          ok: false,
          durationMs: 25,
        },
        {
          id: 'previous-error-2',
          timestamp: new Date(now - 8 * day).toISOString(),
          channel: 'cli',
          eventType: 'llm_error',
          ok: false,
        },
      ], null, 2),
    );
    await fs.writeFile(
      path.join(root, 'harness-runs', 'failed-run.json'),
      JSON.stringify({
        runId: 'failed-run',
        kind: 'run',
        ok: false,
        workspace: '/tmp/demo',
        task: 'demo task',
        validateCommand: 'npm test',
        updatedAt: new Date(now - day).toISOString(),
      }, null, 2),
    );

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'karpathian-loop', '--period', '7', '--json'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        HOME: home,
        ROCKETCLAW2_TELEMETRY_PATH: telemetryPath,
      },
    });

    const report = JSON.parse(stdout);
    expect(report.currentMetrics.totalErrors).toBe(1);
    expect(report.previousMetrics.totalErrors).toBe(2);
    expect(report.currentMetrics.failedHarnessRuns).toBe(1);
    expect(report.improvingSignals.some((item: string) => item.includes('Total errors'))).toBe(true);

    await fs.rm(home, { recursive: true, force: true });
    await fs.rm(telemetryPath, { force: true });
  }, 15000);
});
