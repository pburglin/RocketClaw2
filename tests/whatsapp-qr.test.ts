import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { authorizeWhatsAppQrToken, createWhatsAppQrSession } from '../src/messaging/whatsapp-qr.js';
import { loadWhatsAppSession } from '../src/messaging/whatsapp-session.js';

describe('whatsapp qr bootstrap', () => {
  it('creates a qr bootstrap token', () => {
    const qr = createWhatsAppQrSession();
    expect(qr.qrToken.length).toBeGreaterThan(10);
    expect(qr.qrText).toContain('whatsapp://link-device?token=');
  });

  it('authorizes a qr token into a persisted whatsapp session', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-qr-${Date.now()}`);
    const qr = createWhatsAppQrSession();
    await authorizeWhatsAppQrToken({ qrToken: qr.qrToken, phoneNumber: '+15551234567' }, root);
    const session = await loadWhatsAppSession(root);
    expect(session?.mode).toBe('session');
    expect(session?.token).toBe(qr.qrToken);
  });
});
