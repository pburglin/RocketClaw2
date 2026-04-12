import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { saveWhatsAppSession, loadWhatsAppSession } from '../src/messaging/whatsapp-session.js';
import { listWhatsAppNativeOutbox } from '../src/messaging/whatsapp-native.js';
import { WhatsAppChannelPlugin } from '../src/messaging/channels/whatsapp.js';

describe('whatsapp session transport mode', () => {
  it('fails if session mode is configured without a saved session profile', async () => {
    const plugin = new WhatsAppChannelPlugin({ mode: 'session' });
    await expect(plugin.send({ to: '+15551234567', text: 'hello' })).rejects.toThrow('no local WhatsApp session profile');
  });

  it('enforces self-chat-only sends by default in session mode', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-transport-${Date.now()}`);
    await saveWhatsAppSession({
      mode: 'session',
      token: 'session-token-123',
      phoneNumber: '+15551234567',
      createdAt: new Date().toISOString(),
    }, root);

    const plugin = new WhatsAppChannelPlugin({ mode: 'session', root });
    await expect(plugin.send({ to: '+15557654321', text: 'hello there' })).rejects.toThrow('self-chat-only');

    const outbox = await listWhatsAppNativeOutbox(root);
    expect(outbox).toHaveLength(0);
  });

  it('uses native session transport semantics for self-chat sends and optional external override', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-transport-allowed-${Date.now()}`);
    await saveWhatsAppSession({
      mode: 'session',
      token: 'session-token-123',
      phoneNumber: '+15551234567',
      createdAt: new Date().toISOString(),
    }, root);

    const selfChatPlugin = new WhatsAppChannelPlugin({ mode: 'session', root, ownPhoneNumber: '+15551234567' });
    const selfChat = await selfChatPlugin.send({ to: '+15551234567', text: 'self note' });
    expect(selfChat.ok).toBe(true);
    expect(selfChat.transportId).toContain('native-session-');
    expect(selfChat.detail).toContain('native-session:+15551234567:+15551234567:self note');
    expect(selfChat.detail).toContain('lastUsed=');

    const updated = await loadWhatsAppSession(root);
    expect(updated?.lastUsedAt).toBeTruthy();

    const overridePlugin = new WhatsAppChannelPlugin({ mode: 'session', root, selfChatOnly: false });
    const external = await overridePlugin.send({ to: '+15557654321', text: 'hello there' });
    expect(external.ok).toBe(true);
    expect(external.detail).toContain('native-session:+15551234567:+15557654321:hello there');

    const outbox = await listWhatsAppNativeOutbox(root);
    expect(outbox.some((item) => item.text === 'self note')).toBe(true);
    expect(outbox.some((item) => item.text === 'hello there')).toBe(true);
  });
});
