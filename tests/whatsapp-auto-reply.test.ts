import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { configureWhatsApp } from '../src/messaging/whatsapp-config.js';
import { sendWhatsAppAutoReply } from '../src/messaging/whatsapp-auto-reply.js';

describe('whatsapp auto reply', () => {
  it('sends through configured whatsapp plugin', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-reply-${Date.now()}`);
    await configureWhatsApp({ enabled: true, mode: 'mock', defaultRecipient: '+15550000000' }, root);
    const result = await sendWhatsAppAutoReply({ to: '+15551234567', text: 'hello back' }, root);
    expect(result.ok).toBe(true);
    expect(result.detail).toContain('hello back');
  });
});
