import { afterEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { startWhatsAppWebhookListener } from '../src/messaging/whatsapp-listener.js';
import { configureWhatsApp } from '../src/messaging/whatsapp-config.js';

const servers: Array<{ close: () => void }> = [];

afterEach(() => {
  while (servers.length > 0) {
    servers.pop()?.close();
  }
});

describe('whatsapp listener native session mode', () => {
  it('routes inbound events through native processor when session mode is active', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-native-listener-${Date.now()}`);
    await configureWhatsApp({ enabled: true, mode: 'session', selfChatOnly: true, defaultRecipient: '+1555' }, root);
    const server = await startWhatsAppWebhookListener({ port: 8801, root });
    servers.push(server);

    const response = await fetch('http://127.0.0.1:8801/whatsapp/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ from: '+1666', to: '+1555', text: 'status' }),
    });
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.native).toBe(true);
    expect(json.result.accepted).toBe(false);
    expect(json.result.reason).toBe('filtered-by-self-chat-policy');
  });
});
