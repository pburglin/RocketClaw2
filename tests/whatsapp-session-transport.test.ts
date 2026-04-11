import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { saveWhatsAppSession } from '../src/messaging/whatsapp-session.js';
import { WhatsAppChannelPlugin } from '../src/messaging/channels/whatsapp.js';

describe('whatsapp session transport mode', () => {
  it('fails if session mode is configured without a saved session profile', async () => {
    const plugin = new WhatsAppChannelPlugin({ mode: 'session' });
    await expect(plugin.send({ to: '+15551234567', text: 'hello' })).rejects.toThrow('no local WhatsApp session profile');
  });

  it('uses persisted session profile in session mode', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-transport-${Date.now()}`);
    await saveWhatsAppSession({
      mode: 'session',
      token: 'session-token-123',
      phoneNumber: '+15551234567',
      createdAt: new Date().toISOString(),
    }, root);

    const plugin = new WhatsAppChannelPlugin({ mode: 'session', root });
    const result = await plugin.send({ to: '+15557654321', text: 'hello there' });
    expect(result.ok).toBe(true);
    expect(result.transportId).toContain('session-whatsapp');
    expect(result.detail).toContain('+15551234567');
    expect(result.detail).toContain('lastUsed=');

    const updated = await import('../src/messaging/whatsapp-session.js').then((m) => m.loadWhatsAppSession(root));
    expect(updated?.lastUsedAt).toBeTruthy();
  });
});
