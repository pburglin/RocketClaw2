import { afterEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { listWhatsAppInbound, startWhatsAppWebhookListener } from '../src/messaging/whatsapp-listener.js';

const servers: Array<{ close: () => void }> = [];

afterEach(() => {
  while (servers.length > 0) {
    servers.pop()?.close();
  }
});

describe('whatsapp webhook listener', () => {
  it('accepts inbound webhook events and persists them', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-${Date.now()}`);
    const server = await startWhatsAppWebhookListener({ port: 8799, root });
    servers.push(server);

    const response = await fetch('http://127.0.0.1:8799/whatsapp/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ from: '+15551234567', text: 'hello bob' }),
    });

    expect(response.ok).toBe(true);
    const items = await listWhatsAppInbound(root);
    expect(items).toHaveLength(1);
    expect(items[0]?.from).toBe('+15551234567');
    expect(items[0]?.text).toBe('hello bob');
  });
});
