import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { configureWhatsApp } from '../src/messaging/whatsapp-config.js';
import { loadAppConfig } from '../src/tools/config-store.js';

describe('configureWhatsApp', () => {
  it('persists whatsapp integration settings into app config', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-${Date.now()}`);
    await configureWhatsApp({
      mode: 'session',
      webhookUrl: 'https://example.com/hook',
      defaultRecipient: '+15551234567',
      selfChatOnly: false,
      ownPhoneNumber: '+15551234567',
    }, root);
    const config = await loadAppConfig(root);
    expect(config.messaging.whatsapp.mode).toBe('session');
    expect(config.messaging.whatsapp.defaultRecipient).toBe('+15551234567');
    expect(config.messaging.whatsapp.selfChatOnly).toBe(false);
    expect(config.messaging.whatsapp.ownPhoneNumber).toBe('+15551234567');
    await fs.rm(root, { recursive: true, force: true });
  });
});
