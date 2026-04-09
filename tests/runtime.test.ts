import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { getRuntimeSummary } from '../src/core/runtime.js';
import { loadConfig, loadConfigFromDisk } from '../src/config/load-config.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('getRuntimeSummary', () => {
  it('returns bootstrap status', async () => {
    await expect(getRuntimeSummary()).resolves.toMatchObject({
      name: 'RocketClaw2',
      version: '0.1.0',
      status: 'bootstrap-ready',
    });
  });

  it('provides default recall scoring config values', () => {
    const config = loadConfig({});
    expect(config.recallScoring.sessionSalienceMultiplier).toBe(3);
    expect(config.recallScoring.diversityPenaltyPerBucketHit).toBe(15);
    expect(config.recallScoring.semanticRecency.older).toBe(-6);
  });

  it('loads persisted recall scoring config from disk', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-config-${Date.now()}`);
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(
      path.join(root, 'config.yaml'),
      YAML.stringify({ recallScoring: { sessionSalienceMultiplier: 0, semanticRecency: { older: -2 } } }),
    );

    const config = await loadConfigFromDisk(root);
    expect(config.recallScoring.sessionSalienceMultiplier).toBe(0);
    expect(config.recallScoring.semanticRecency.older).toBe(-2);
    expect(config.recallScoring.diversityPenaltyPerBucketHit).toBe(15);

    await fs.rm(root, { recursive: true, force: true });
  });

  it('prints the active recall profile from the CLI', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-cli-home-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(appRoot, { recursive: true });
    await fs.writeFile(
      path.join(appRoot, 'config.yaml'),
      YAML.stringify({ recallScoring: { sessionSalienceMultiplier: 9 } }),
    );

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'recall-profile'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });

    const parsed = JSON.parse(stdout);
    expect(parsed.sessionSalienceMultiplier).toBe(9);

    await fs.rm(homeRoot, { recursive: true, force: true });
  });

  it('prints the resolved persisted config from the CLI', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-cli-config-home-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(appRoot, { recursive: true });
    await fs.writeFile(
      path.join(appRoot, 'config.yaml'),
      YAML.stringify({ profile: 'demo', recallScoring: { diversityPenaltyPerBucketHit: 11 } }),
    );

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'config-show'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });

    const parsed = JSON.parse(stdout);
    expect(parsed.profile).toBe('demo');
    expect(parsed.recallScoring.diversityPenaltyPerBucketHit).toBe(11);

    await fs.rm(homeRoot, { recursive: true, force: true });
  });

  it('explains the active recall profile in human-readable text', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-cli-explain-home-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(appRoot, { recursive: true });
    await fs.writeFile(
      path.join(appRoot, 'config.yaml'),
      YAML.stringify({ recallScoring: { sessionSalienceMultiplier: 9 } }),
    );

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'recall-explain'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });

    expect(stdout).toContain('Recall scoring profile');
    expect(stdout).toContain('Session salience multiplier: 9');
    expect(stdout).toContain('higher means important session messages outrank shallow lexical matches more often');

    await fs.rm(homeRoot, { recursive: true, force: true });
  });

  it('includes persisted recall scoring in doctor/runtime diagnostics', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-doctor-${Date.now()}`);
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(
      path.join(root, 'config.yaml'),
      YAML.stringify({ recallScoring: { diversityPenaltyPerBucketHit: 7 } }),
    );

    const summary = await getRuntimeSummary(root);
    expect(summary.recallScoring?.diversityPenaltyPerBucketHit).toBe(7);

    await fs.rm(root, { recursive: true, force: true });
  });
});
