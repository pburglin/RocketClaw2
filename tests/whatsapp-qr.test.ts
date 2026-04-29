import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { authorizeWhatsAppQrToken, createWhatsAppQrSession } from '../src/messaging/whatsapp-qr.js';
import { loadWhatsAppSession } from '../src/messaging/whatsapp-session.js';
import { loadAppConfig } from '../src/tools/config-store.js';

describe('whatsapp qr bootstrap', () => {
  it('creates a qr bootstrap token', async () => {
    const qr = await createWhatsAppQrSession();
    expect(qr.qrToken.length).toBeGreaterThan(10);
    expect(qr.qrText).toContain('whatsapp://link-device?token=');
    expect(qr.qrDataUrl).toContain('data:image/png;base64,');
  });

  it('authorizes a qr token into a persisted whatsapp session and syncs own phone number into config', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-qr-${Date.now()}`);
    const qr = await createWhatsAppQrSession();
    await authorizeWhatsAppQrToken({ qrToken: qr.qrToken, phoneNumber: '+15551234567' }, root);
    const session = await loadWhatsAppSession(root);
    const config = await loadAppConfig(root);
    expect(session?.mode).toBe('session');
    expect(session?.token).toBe(qr.qrToken);
    expect(session?.phoneNumber).toBe('+15551234567');
    expect(config.messaging.whatsapp.ownPhoneNumber).toBe('+15551234567');
  });
});