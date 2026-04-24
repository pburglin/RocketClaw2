import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { getRuntimeSummary } from '../src/core/runtime.js';
import { buildRecallScoringDiff, getDefaultRecallScoringConfig, listRecallScoringPaths, loadConfig, loadConfigFromDisk, resetRecallScoring, setRecallScoringValue } from '../src/config/load-config.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('getRuntimeSummary', { timeout: 15000 }, () => {
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

  it('supports session-show summary and limit modes from the CLI', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-cli-session-show-home-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(path.join(appRoot, 'sessions'), { recursive: true });
    const session = {
      id: 'session-demo',
      title: 'Demo Session',
      createdAt: '2026-04-10T20:00:00.000Z',
      updatedAt: '2026-04-10T20:03:00.000Z',
      messages: [
        { id: 'm1', role: 'system', text: 'system boot', createdAt: '2026-04-10T20:00:00.000Z' },
        { id: 'm2', role: 'user', text: 'hello', createdAt: '2026-04-10T20:01:00.000Z' },
        { id: 'm3', role: 'assistant', text: 'hi there', createdAt: '2026-04-10T20:02:00.000Z' },
      ],
    };
    await fs.writeFile(path.join(appRoot, 'sessions', 'session-demo.json'), JSON.stringify(session, null, 2));

    const summary = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'session-show', '--id', 'session-demo', '--summary'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });
    expect(summary.stdout).toContain('Role counts: system=1 user=1 assistant=1');

    const limited = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'session-show', '--id', 'session-demo', '--limit', '1'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });
    expect(limited.stdout).toContain('Showing last 1 messages (2 earlier hidden)');
    expect(limited.stdout).toContain('[assistant] hi there');
    expect(limited.stdout).not.toContain('[system] system boot');

    await fs.rm(homeRoot, { recursive: true, force: true });
  }, 15000);

  it('syncs own phone number into config when saving a whatsapp session from the CLI', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-cli-whatsapp-session-home-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(appRoot, { recursive: true });
    await fs.writeFile(
      path.join(appRoot, 'config.yaml'),
      YAML.stringify({ messaging: { whatsapp: { enabled: true, mode: 'session', selfChatOnly: true } } }),
    );

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'whatsapp-session', '--set-token', 'session-token-123', '--phone-number', '+15551234567'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });

    expect(stdout).toContain('synced ownPhoneNumber into config');

    const configRaw = await fs.readFile(path.join(appRoot, 'config.yaml'), 'utf8');
    const config = YAML.parse(configRaw);
    expect(config.messaging.whatsapp.ownPhoneNumber).toBe('+15551234567');

    const sessionRaw = await fs.readFile(path.join(appRoot, 'state', 'whatsapp-session.json'), 'utf8');
    const session = JSON.parse(sessionRaw);
    expect(session.phoneNumber).toBe('+15551234567');

    await fs.rm(homeRoot, { recursive: true, force: true });
  });

  it('reports config sync when authorizing a whatsapp qr session from the CLI', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-cli-whatsapp-qr-home-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(appRoot, { recursive: true });
    await fs.writeFile(
      path.join(appRoot, 'config.yaml'),
      YAML.stringify({ messaging: { whatsapp: { enabled: true, mode: 'session', selfChatOnly: true } } }),
    );

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'whatsapp-qr', '--authorize', 'qr-token-123', '--phone-number', '+15557654321'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });

    expect(stdout).toContain('synced ownPhoneNumber into config');

    const configRaw = await fs.readFile(path.join(appRoot, 'config.yaml'), 'utf8');
    const config = YAML.parse(configRaw);
    expect(config.messaging.whatsapp.ownPhoneNumber).toBe('+15557654321');

    const sessionRaw = await fs.readFile(path.join(appRoot, 'state', 'whatsapp-session.json'), 'utf8');
    const session = JSON.parse(sessionRaw);
    expect(session.token).toBe('qr-token-123');
    expect(session.phoneNumber).toBe('+15557654321');

    await fs.rm(homeRoot, { recursive: true, force: true });
  });

  it('includes richer messaging and session details in workspace-status output', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-cli-workspace-status-home-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(path.join(appRoot, 'sessions'), { recursive: true });
    await fs.mkdir(path.join(appRoot, 'state'), { recursive: true });
    await fs.writeFile(
      path.join(appRoot, 'config.yaml'),
      YAML.stringify({ messaging: { whatsapp: { enabled: true, mode: 'session', defaultRecipient: '+15551234567', selfChatOnly: true, ownPhoneNumber: '+15557654321' } } }),
    );
    await fs.writeFile(
      path.join(appRoot, 'sessions', 'session-demo.json'),
      JSON.stringify({
        id: 'session-demo',
        title: 'Demo Session',
        createdAt: '2026-04-10T20:00:00.000Z',
        updatedAt: '2026-04-10T20:03:00.000Z',
        messages: [
          { id: 'm1', role: 'user', text: 'hello', createdAt: '2026-04-10T20:01:00.000Z' },
          { id: 'm2', role: 'assistant', text: 'hi there', createdAt: '2026-04-10T20:02:00.000Z' },
        ],
      }, null, 2),
    );
    await fs.writeFile(
      path.join(appRoot, 'state', 'whatsapp-session.json'),
      JSON.stringify({
        mode: 'session',
        token: 'session-token-123456',
        phoneNumber: '+15557654321',
        createdAt: '2026-04-10T20:00:00.000Z',
        lastUsedAt: '2026-04-10T20:05:00.000Z',
      }, null, 2),
    );

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'workspace-status'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });

    expect(stdout).toContain('WhatsApp: enabled (session)');
    expect(stdout).toContain('WhatsApp default recipient: +15551234567');
    expect(stdout).toContain('WhatsApp self-chat-only: yes');
    expect(stdout).toContain('WhatsApp configured own phone number: +15557654321');
    expect(stdout).toContain('WhatsApp session configured: yes');
    expect(stdout).toContain('Messages: 2');
    expect(stdout).toContain('Latest session update: 2026-04-10T20:03:00.000Z');

    await fs.rm(homeRoot, { recursive: true, force: true });
  });

  it('includes runtime-aware guidance in next-actions output', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-cli-next-actions-home-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(appRoot, { recursive: true });
    await fs.writeFile(
      path.join(appRoot, 'config.yaml'),
      YAML.stringify({ messaging: { whatsapp: { enabled: true, mode: 'session', selfChatOnly: true } } }),
    );

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'next-actions'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });

    expect(stdout).toContain('whatsapp-config --default-recipient');
    expect(stdout).toContain('WhatsApp session mode is enabled but no local session is configured');
    expect(stdout).toContain('whatsapp-config --own-phone-number');
    expect(stdout).toContain('session-create --title "First Session"');

    await fs.rm(homeRoot, { recursive: true, force: true });
  });

  it('includes runtime-aware readiness warnings in doctor output', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-cli-doctor-home-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(appRoot, { recursive: true });
    await fs.writeFile(
      path.join(appRoot, 'config.yaml'),
      YAML.stringify({ messaging: { whatsapp: { enabled: true, mode: 'session', selfChatOnly: true } } }),
    );

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'doctor'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });

    expect(stdout).toContain('Doctor status: attention-needed');
    expect(stdout).toContain('WARN | whatsapp-session-readiness | Session mode enabled but no local WhatsApp session is configured');
    expect(stdout).toContain('WARN | whatsapp-self-chat-identity | Self-chat-only session mode is enabled but ownPhoneNumber is not configured');
    expect(stdout).toContain('WARN | session-activity | Sessions=0, messages=0, latest=n/a');

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

  it('includes session state in messaging-summary json output', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-cli-messaging-summary-home-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(path.join(appRoot, 'state'), { recursive: true });
    await fs.writeFile(
      path.join(appRoot, 'config.yaml'),
      YAML.stringify({ messaging: { whatsapp: { enabled: true, mode: 'session', ownPhoneNumber: '+15551234567' } } }),
    );
    await fs.writeFile(
      path.join(appRoot, 'state', 'whatsapp-session.json'),
      JSON.stringify({ mode: 'session', token: 'session-token-123', phoneNumber: '+15551234567', createdAt: '2026-04-11T12:00:00.000Z' }, null, 2),
    );

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'messaging-summary', '--json'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });

    const parsed = JSON.parse(stdout);
    expect(parsed.whatsapp.mode).toBe('session');
    expect(parsed.sessionState.whatsapp.phoneNumber).toBe('+15551234567');
    expect(parsed.sessionState.whatsapp.token).toBe('session-token-123');

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

  it('can persist a recall scoring update by dot path', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-set-recall-${Date.now()}`);
    await fs.mkdir(root, { recursive: true });
    const updated = await setRecallScoringValue('sessionRecency.older', -30, root);
    expect(updated.recallScoring.sessionRecency.older).toBe(-30);

    const reloaded = await loadConfigFromDisk(root);
    expect(reloaded.recallScoring.sessionRecency.older).toBe(-30);

    await fs.rm(root, { recursive: true, force: true });
  });

  it('lists valid recall scoring paths', () => {
    expect(listRecallScoringPaths()).toContain('sessionSalienceMultiplier');
    expect(listRecallScoringPaths()).toContain('semanticRecency.older');
  });

  it('throws a helpful error for unknown recall scoring paths', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-set-recall-error-${Date.now()}`);
    await fs.mkdir(root, { recursive: true });
    await expect(setRecallScoringValue('not.real', 1, root)).rejects.toThrow('Valid paths:');
    await fs.rm(root, { recursive: true, force: true });
  });

  it('rejects out-of-range recall scoring values with a clear error', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-set-recall-range-${Date.now()}`);
    await fs.mkdir(root, { recursive: true });
    await expect(setRecallScoringValue('sessionSalienceMultiplier', 999, root)).rejects.toThrow('Allowed range:');
    await fs.rm(root, { recursive: true, force: true });
  });

  it('updates recall scoring from the CLI', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-cli-set-home-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(appRoot, { recursive: true });
    await fs.writeFile(path.join(appRoot, 'config.yaml'), YAML.stringify({}));

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'recall-set', '--path', 'semanticRecency.older', '--value', '-9'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });

    const parsed = JSON.parse(stdout);
    expect(parsed.semanticRecency.older).toBe(-9);

    const reloaded = await loadConfigFromDisk(appRoot);
    expect(reloaded.recallScoring.semanticRecency.older).toBe(-9);

    await fs.rm(homeRoot, { recursive: true, force: true });
  });

  it('prints valid recall scoring paths from the CLI', async () => {
    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'recall-paths'], {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    const parsed = JSON.parse(stdout);
    expect(parsed.validPaths).toContain('sessionRecency.older');
  });

  it('fails from the CLI when a recall scoring value is out of range', async () => {
    await expect(
      execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'recall-set', '--path', 'sessionSalienceMultiplier', '--value', '999'], {
        cwd: process.cwd(),
        env: { ...process.env },
      }),
    ).rejects.toThrow('Allowed range:');
  });

  it('resets a specific recall scoring path to its default', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-reset-specific-${Date.now()}`);
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(
      path.join(root, 'config.yaml'),
      YAML.stringify({ recallScoring: { sessionSalienceMultiplier: 9, diversityPenaltyPerBucketHit: 77 } }),
    );

    const defaults = getDefaultRecallScoringConfig();
    const updated = await resetRecallScoring(['sessionSalienceMultiplier'], root);
    expect(updated.recallScoring.sessionSalienceMultiplier).toBe(defaults.sessionSalienceMultiplier);
    // diversityPenaltyPerBucketHit should be unchanged
    expect(updated.recallScoring.diversityPenaltyPerBucketHit).toBe(77);

    await fs.rm(root, { recursive: true, force: true });
  });

  it('resets all recall scoring paths to defaults when no path is specified', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-reset-all-${Date.now()}`);
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(
      path.join(root, 'config.yaml'),
      YAML.stringify({ recallScoring: { sessionSalienceMultiplier: 9, semanticRecency: { older: 99 } } }),
    );

    const defaults = getDefaultRecallScoringConfig();
    const updated = await resetRecallScoring(undefined, root);
    expect(updated.recallScoring.sessionSalienceMultiplier).toBe(defaults.sessionSalienceMultiplier);
    expect(updated.recallScoring.semanticRecency.older).toBe(defaults.semanticRecency.older);

    await fs.rm(root, { recursive: true, force: true });
  });

  it('resets all recall scoring from the CLI', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-cli-reset-home-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(appRoot, { recursive: true });
    await fs.writeFile(
      path.join(appRoot, 'config.yaml'),
      YAML.stringify({ recallScoring: { sessionSalienceMultiplier: 9 } }),
    );

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'recall-reset'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });

    const defaults = getDefaultRecallScoringConfig();
    const parsed = JSON.parse(stdout);
    expect(parsed.sessionSalienceMultiplier).toBe(defaults.sessionSalienceMultiplier);

    await fs.rm(homeRoot, { recursive: true, force: true });
  });

  it('resets a specific recall scoring path from the CLI', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-cli-reset-path-home-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(appRoot, { recursive: true });
    await fs.writeFile(
      path.join(appRoot, 'config.yaml'),
      YAML.stringify({ recallScoring: { sessionSalienceMultiplier: 9, duplicateSemanticPriorityBonus: 400 } }),
    );

    const defaults = getDefaultRecallScoringConfig();
    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'recall-reset', '--path', 'sessionSalienceMultiplier'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });

    const parsed = JSON.parse(stdout);
    expect(parsed.sessionSalienceMultiplier).toBe(defaults.sessionSalienceMultiplier);
    // other field should be unchanged
    expect(parsed.duplicateSemanticPriorityBonus).toBe(400);

    await fs.rm(homeRoot, { recursive: true, force: true });
  });

  it('builds a recall scoring diff between current and defaults', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-diff-${Date.now()}`);
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(
      path.join(root, 'config.yaml'),
      YAML.stringify({ recallScoring: { sessionSalienceMultiplier: 7, semanticRecency: { older: -30 } } }),
    );

    const diff = await buildRecallScoringDiff(root);
    expect(diff['sessionSalienceMultiplier'].current).toBe(7);
    expect(diff['sessionSalienceMultiplier'].delta).toBe(7 - 3); // default is 3
    expect(diff['semanticRecency.older'].current).toBe(-30);
    expect(diff['semanticRecency.older'].delta).toBe(-30 - (-6)); // default is -6
    expect(diff['sessionRecency.within1Day'].current).toBe(18); // default unchanged
    expect(diff['sessionRecency.within1Day'].delta).toBe(0);

    await fs.rm(root, { recursive: true, force: true });
  });

  it('prints no-delta message from CLI when all fields are at defaults', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-diff-cli-defaults-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(appRoot, { recursive: true });
    await fs.writeFile(path.join(appRoot, 'config.yaml'), YAML.stringify({}));

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'recall-diff'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });

    expect(stdout).toContain('at their default values');

    await fs.rm(homeRoot, { recursive: true, force: true });
  });

  it('shows non-zero deltas from CLI when values differ from defaults', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-diff-cli-delta-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(appRoot, { recursive: true });
    await fs.writeFile(
      path.join(appRoot, 'config.yaml'),
      YAML.stringify({ recallScoring: { sessionSalienceMultiplier: 9 } }),
    );

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'recall-diff'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });

    expect(stdout).toContain('sessionSalienceMultiplier');
    expect(stdout).toContain('delta=');

    await fs.rm(homeRoot, { recursive: true, force: true });
  });
});
