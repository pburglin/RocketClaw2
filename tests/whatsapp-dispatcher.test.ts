import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { dispatchWhatsAppInbound } from '../src/messaging/whatsapp-dispatcher.js';

describe('whatsapp dispatcher', () => {
  it('dispatches workspace status requests', async () => {
    const result = await dispatchWhatsAppInbound({
      type: 'message',
      from: '+15551234567',
      text: 'status',
      receivedAt: new Date().toISOString(),
    });
    expect(result.matched).toBe(true);
    expect(result.command).toBe('workspace-status');
    expect(result.replyText).toContain('RocketClaw2 Workspace Status');
  });

  it('dispatches next-actions requests', async () => {
    const result = await dispatchWhatsAppInbound({
      type: 'message',
      from: '+15551234567',
      text: 'next-actions',
      receivedAt: new Date().toISOString(),
    });
    expect(result.matched).toBe(true);
    expect(result.command).toBe('next-actions');
  });

  it('dispatches doctor requests against the provided runtime root', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-dispatch-doctor-${Date.now()}`);
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(
      path.join(root, 'config.yaml'),
      YAML.stringify({ messaging: { whatsapp: { enabled: true, mode: 'session' } } }),
    );

    const result = await dispatchWhatsAppInbound({
      type: 'message',
      from: '+15551234567',
      text: 'doctor',
      receivedAt: new Date().toISOString(),
    }, root);
    expect(result.matched).toBe(true);
    expect(result.command).toBe('doctor');
    expect(result.replyText).toContain('Doctor status: attention-needed');
    expect(result.replyText).toContain('whatsapp-session-readiness');

    await fs.rm(root, { recursive: true, force: true });
  });

  it('dispatches help requests', async () => {
    const result = await dispatchWhatsAppInbound({
      type: 'message',
      from: '+15551234567',
      text: 'help',
      receivedAt: new Date().toISOString(),
    });
    expect(result.matched).toBe(true);
    expect(result.command).toBe('help');
    expect(result.replyText).toContain('RocketClaw2 WhatsApp commands:');
    expect(result.replyText).toContain('- doctor');
  });
});
