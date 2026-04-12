import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { configureWhatsApp } from '../src/messaging/whatsapp-config.js';
import { sendWhatsAppAutoReply } from '../src/messaging/whatsapp-auto-reply.js';
import { saveWhatsAppSession } from '../src/messaging/whatsapp-session.js';
import { listWhatsAppNativeOutbox } from '../src/messaging/whatsapp-native.js';

describe('whatsapp auto reply', () => {
  it('sends through configured whatsapp plugin', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-reply-${Date.now()}`);
    await configureWhatsApp({ enabled: true, mode: 'mock', defaultRecipient: '+15550000000' }, root);
    const result = await sendWhatsAppAutoReply({ to: '+15551234567', text: 'hello back' }, root);
    expect(result.ok).toBe(true);
    expect(result.detail).toContain('hello back');
  });

  it('uses the provided runtime root for session-mode auto replies', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-reply-session-${Date.now()}`);
    await configureWhatsApp({ enabled: true, mode: 'session', ownPhoneNumber: '+15551234567' }, root);
    await saveWhatsAppSession({
      mode: 'session',
      token: 'session-token-123',
      phoneNumber: '+15551234567',
      createdAt: new Date().toISOString(),
    }, root);

    const result = await sendWhatsAppAutoReply({ to: '+15551234567', text: 'self reply' }, root);
    expect(result.ok).toBe(true);
    expect(result.detail).toContain('native-session:+15551234567:+15551234567:self reply');

    const outbox = await listWhatsAppNativeOutbox(root);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]?.text).toBe('self reply');
  });
});
