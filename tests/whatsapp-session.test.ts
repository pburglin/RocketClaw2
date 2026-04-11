import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { clearWhatsAppSession, loadWhatsAppSession, saveWhatsAppSession, touchWhatsAppSession } from '../src/messaging/whatsapp-session.js';

describe('whatsapp session profile', () => {
  it('saves, loads, touches, and clears a local session profile', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-session-profile-${Date.now()}`);
    await saveWhatsAppSession({
      mode: 'session',
      token: 'abc123',
      phoneNumber: '+15551234567',
      createdAt: new Date().toISOString(),
    }, root);
    const loaded = await loadWhatsAppSession(root);
    expect(loaded?.token).toBe('abc123');
    const touched = await touchWhatsAppSession(root);
    expect(touched?.lastUsedAt).toBeTruthy();
    await clearWhatsAppSession(root);
    const cleared = await loadWhatsAppSession(root);
    expect(cleared).toBeNull();
  });
});
