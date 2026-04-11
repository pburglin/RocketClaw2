import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { processNativeWhatsAppInbound } from '../src/messaging/whatsapp-native-inbound.js';
import { WhatsAppNativeTransport } from '../src/messaging/whatsapp-native.js';

describe('native whatsapp inbound loop', () => {
  it('rejects inbound messages outside self-chat policy', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-native-inbound-${Date.now()}`);
    const transport = new WhatsAppNativeTransport({ selfChatOnly: true, ownPhoneNumber: '+1555' });
    const result = await processNativeWhatsAppInbound(transport, {
      type: 'message',
      from: '+1666',
      text: 'status',
      receivedAt: new Date().toISOString(),
      raw: { to: '+1555' },
    }, root);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('filtered-by-self-chat-policy');
  });

  it('accepts self-chat inbound messages and bridges them', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-native-inbound-self-${Date.now()}`);
    const transport = new WhatsAppNativeTransport({ selfChatOnly: true, ownPhoneNumber: '+1555' });
    const result = await processNativeWhatsAppInbound(transport, {
      type: 'message',
      from: '+1555',
      text: 'next-actions',
      receivedAt: new Date().toISOString(),
      raw: { to: '+1555' },
    }, root);
    expect(result.accepted).toBe(true);
    expect(typeof result.sessionId).toBe('string');
    expect(result.dispatched?.matched).toBe(true);
  });
});
