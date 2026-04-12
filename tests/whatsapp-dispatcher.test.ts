import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { dispatchWhatsAppInbound } from '../src/messaging/whatsapp-dispatcher.js';

describe('whatsapp dispatcher', () => {
  it('dispatches workspace status requests', async () => {
    const result = await dispatchWhatsAppInbound({ type: 'message', from: '+15551234567', text: 'status', receivedAt: new Date().toISOString() });
    expect(result.matched).toBe(true);
    expect(result.command).toBe('workspace-status');
    expect(result.replyText).toContain('RocketClaw2 Workspace Status');
  });

  it('dispatches next-actions requests', async () => {
    const result = await dispatchWhatsAppInbound({ type: 'message', from: '+15551234567', text: 'next-actions', receivedAt: new Date().toISOString() });
    expect(result.matched).toBe(true);
    expect(result.command).toBe('next-actions');
  });

  it('dispatches doctor requests against the provided runtime root', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-dispatch-doctor-${Date.now()}`);
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({ messaging: { whatsapp: { enabled: true, mode: 'session' } } }));

    const result = await dispatchWhatsAppInbound({ type: 'message', from: '+15551234567', text: 'doctor', receivedAt: new Date().toISOString() }, root);
    expect(result.matched).toBe(true);
    expect(result.command).toBe('doctor');
    expect(result.replyText).toContain('Doctor status: attention-needed');
    expect(result.replyText).toContain('whatsapp-session-readiness');

    await fs.rm(root, { recursive: true, force: true });
  });

  it('dispatches help requests', async () => {
    const result = await dispatchWhatsAppInbound({ type: 'message', from: '+15551234567', text: 'help', receivedAt: new Date().toISOString() });
    expect(result.matched).toBe(true);
    expect(result.command).toBe('help');
    expect(result.replyText).toContain('RocketClaw2 WhatsApp commands:');
    expect(result.replyText).toContain('- doctor');
    expect(result.replyText).toContain('- sessions');
    expect(result.replyText).toContain('- session <id-or-title>');
    expect(result.replyText).toContain('- approvals');
    expect(result.replyText).toContain('- memory');
    expect(result.replyText).toContain('- tools');
    expect(result.replyText).toContain('- messaging');
  });

  it('dispatches compact recent session listings', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-dispatch-sessions-${Date.now()}`);
    await fs.mkdir(path.join(root, 'sessions'), { recursive: true });
    await fs.writeFile(path.join(root, 'sessions', 'one.json'), JSON.stringify({ id: 'one', title: 'Alpha', createdAt: '2026-04-10T20:00:00.000Z', updatedAt: '2026-04-10T20:01:00.000Z', messages: [{ id: 'm1', role: 'user', text: 'hello', createdAt: '2026-04-10T20:01:00.000Z' }] }, null, 2));
    await fs.writeFile(path.join(root, 'sessions', 'two.json'), JSON.stringify({ id: 'two', title: 'Beta', createdAt: '2026-04-10T21:00:00.000Z', updatedAt: '2026-04-10T21:01:00.000Z', messages: [{ id: 'm1', role: 'user', text: 'hi', createdAt: '2026-04-10T21:00:00.000Z' }, { id: 'm2', role: 'assistant', text: 'hello', createdAt: '2026-04-10T21:01:00.000Z' }] }, null, 2));

    const result = await dispatchWhatsAppInbound({ type: 'message', from: '+15551234567', text: 'sessions', receivedAt: new Date().toISOString() }, root);
    expect(result.matched).toBe(true);
    expect(result.command).toBe('sessions');
    expect(result.replyText).toContain('Recent sessions:');
    expect(result.replyText).toContain('Beta | messages=2');
    expect(result.replyText).toContain('Alpha | messages=1');

    await fs.rm(root, { recursive: true, force: true });
  });

  it('dispatches compact pending approval listings', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-dispatch-approvals-${Date.now()}`);
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(path.join(root, 'approvals.json'), JSON.stringify([
      {
        id: 'a1',
        kind: 'message-send',
        target: 'whatsapp',
        detail: 'Send daily report',
        status: 'pending',
        createdAt: '2026-04-10T22:00:00.000Z'
      },
      {
        id: 'a2',
        kind: 'tool-write',
        target: 'file-management',
        detail: 'Write config patch',
        status: 'approved',
        createdAt: '2026-04-10T22:10:00.000Z',
        resolvedAt: '2026-04-10T22:11:00.000Z'
      }
    ], null, 2));

    const result = await dispatchWhatsAppInbound({ type: 'message', from: '+15551234567', text: 'approvals', receivedAt: new Date().toISOString() }, root);
    expect(result.matched).toBe(true);
    expect(result.command).toBe('approvals');
    expect(result.replyText).toContain('Pending approvals:');
    expect(result.replyText).toContain('message-send | whatsapp | Send daily report');
    expect(result.replyText).not.toContain('Write config patch');

    await fs.rm(root, { recursive: true, force: true });
  });

  it('dispatches compact semantic memory listings', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-dispatch-memory-${Date.now()}`);
    await fs.mkdir(path.join(root, 'memory'), { recursive: true });
    await fs.writeFile(path.join(root, 'memory', 'semantic-memory.json'), JSON.stringify([
      {
        id: 'mem-1',
        text: 'Pedro prefers WhatsApp for operator updates',
        salience: 90,
        tags: ['preference'],
        sourceSessionId: 'session-1',
        sourceMessageId: 'msg-1',
        createdAt: '2026-04-10T22:00:00.000Z'
      },
      {
        id: 'mem-2',
        text: 'RocketClaw2 uses TypeScript and file-backed sessions',
        salience: 70,
        tags: ['architecture'],
        sourceSessionId: 'session-2',
        sourceMessageId: 'msg-2',
        createdAt: '2026-04-10T22:10:00.000Z'
      }
    ], null, 2));

    const result = await dispatchWhatsAppInbound({ type: 'message', from: '+15551234567', text: 'memory', receivedAt: new Date().toISOString() }, root);
    expect(result.matched).toBe(true);
    expect(result.command).toBe('memory');
    expect(result.replyText).toContain('Top semantic memory:');
    expect(result.replyText).toContain('salience=90');
    expect(result.replyText).toContain('Pedro prefers WhatsApp');

    await fs.rm(root, { recursive: true, force: true });
  });

  it('dispatches compact tool policy summaries', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-dispatch-tools-${Date.now()}`);
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({
      tools: [
        { toolId: 'file-management', access: 'guarded-write' },
        { toolId: 'calendar', access: 'read-only' },
        { toolId: 'shell', access: 'disabled' },
      ],
    }));

    const result = await dispatchWhatsAppInbound({ type: 'message', from: '+15551234567', text: 'tools', receivedAt: new Date().toISOString() }, root);
    expect(result.matched).toBe(true);
    expect(result.command).toBe('tools');
    expect(result.replyText).toContain('Tool policy summary:');
    expect(result.replyText).toContain('total=3');
    expect(result.replyText).toContain('disabled=1');
    expect(result.replyText).toContain('guarded-write=1');

    await fs.rm(root, { recursive: true, force: true });
  });

  it('dispatches messaging summaries with whatsapp safety posture', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-dispatch-messaging-${Date.now()}`);
    await fs.mkdir(path.join(root, 'state'), { recursive: true });
    await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({
      messaging: {
        whatsapp: {
          enabled: true,
          mode: 'session',
          defaultRecipient: '+15551234567',
          selfChatOnly: true,
          ownPhoneNumber: '+15557654321',
        },
      },
    }));
    await fs.writeFile(path.join(root, 'state', 'whatsapp-session.json'), JSON.stringify({
      mode: 'session',
      token: 'session-token-123',
      phoneNumber: '+15557654321',
      createdAt: '2026-04-10T20:00:00.000Z',
      lastUsedAt: '2026-04-10T20:05:00.000Z',
    }, null, 2));

    const result = await dispatchWhatsAppInbound({ type: 'message', from: '+15551234567', text: 'messaging', receivedAt: new Date().toISOString() }, root);
    expect(result.matched).toBe(true);
    expect(result.command).toBe('messaging-summary');
    expect(result.replyText).toContain('Messaging summary');
    expect(result.replyText).toContain('Self-chat-only: yes');
    expect(result.replyText).toContain('Configured own phone number: +15557654321');
    expect(result.replyText).toContain('Session configured: yes');

    await fs.rm(root, { recursive: true, force: true });
  });

  it('dispatches compact single-session lookups by title or id', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-dispatch-session-show-${Date.now()}`);
    await fs.mkdir(path.join(root, 'sessions'), { recursive: true });
    await fs.writeFile(path.join(root, 'sessions', 'session-123.json'), JSON.stringify({
      id: 'session-123',
      title: 'Gamma Session',
      createdAt: '2026-04-10T22:00:00.000Z',
      updatedAt: '2026-04-10T22:03:00.000Z',
      messages: [
        { id: 'm1', role: 'user', text: 'hello', createdAt: '2026-04-10T22:01:00.000Z' },
        { id: 'm2', role: 'assistant', text: 'hi there', createdAt: '2026-04-10T22:03:00.000Z' }
      ],
    }, null, 2));

    const byTitle = await dispatchWhatsAppInbound({ type: 'message', from: '+15551234567', text: 'session gamma', receivedAt: new Date().toISOString() }, root);
    expect(byTitle.matched).toBe(true);
    expect(byTitle.command).toBe('session-show');
    expect(byTitle.replyText).toContain('Session: Gamma Session');
    expect(byTitle.replyText).toContain('Last: [assistant] hi there');

    const byId = await dispatchWhatsAppInbound({ type: 'message', from: '+15551234567', text: 'session session-123', receivedAt: new Date().toISOString() }, root);
    expect(byId.replyText).toContain('ID: session-123');

    await fs.rm(root, { recursive: true, force: true });
  });
});
