import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { saveWhatsAppSession } from '../src/messaging/whatsapp-session.js';
import {
  assertWhatsAppNativeReady,
  listWhatsAppNativeOutbox,
  sendWhatsAppNativeMessage,
  shouldAcceptWhatsAppInbound,
  shouldAllowWhatsAppOutbound,
  WhatsAppNativeTransport,
} from '../src/messaging/whatsapp-native.js';

describe('whatsapp native transport', () => {
  it('requires a configured session before native transport is ready', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-whatsapp-native-missing-${Date.now()}`);
    await expect(assertWhatsAppNativeReady(root)).rejects.toThrow('not configured');
  });

  it('sends through native-session and persists outbound history', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-whatsapp-native-${Date.now()}`);
    await saveWhatsAppSession({
      mode: 'session',
      token: 'wa-token',
      phoneNumber: '+15551234567',
      createdAt: new Date().toISOString(),
    }, root);

    const ready = await assertWhatsAppNativeReady(root);
    expect(ready.phoneNumber).toBe('+15551234567');

    const result = await sendWhatsAppNativeMessage({ from: '+15550000000', to: '+15557654321', text: 'hello native' }, root);
    expect(result.ok).toBe(true);
    expect(result.transport).toBe('native-session');
    expect(result.detail).toContain('+15551234567:+15557654321:hello native');

    const outbox = await listWhatsAppNativeOutbox(root);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]?.from).toBe('+15551234567');
    expect(outbox[0]?.to).toBe('+15557654321');
    expect(outbox[0]?.text).toBe('hello native');
  });

  it('supports self-chat-only inbound and outbound filtering', () => {
    expect(shouldAcceptWhatsAppInbound({ from: '+1', to: '+2', text: 'hi' }, { selfChatOnly: false })).toBe(true);
    expect(shouldAcceptWhatsAppInbound({ from: '+1', to: '+1', text: 'hi' }, { selfChatOnly: true, ownPhoneNumber: '+1' })).toBe(true);
    expect(shouldAcceptWhatsAppInbound({ from: '+1', to: '+2', text: 'hi' }, { selfChatOnly: true, ownPhoneNumber: '+1' })).toBe(false);

    expect(shouldAllowWhatsAppOutbound({ to: '+2' }, { selfChatOnly: false })).toBe(true);
    expect(shouldAllowWhatsAppOutbound({ to: '+1' }, { selfChatOnly: true, ownPhoneNumber: '+1' })).toBe(true);
    expect(shouldAllowWhatsAppOutbound({ to: '+2' }, { selfChatOnly: true, ownPhoneNumber: '+1' })).toBe(false);
  });

  it('exposes the same native-session behavior through the transport class', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-whatsapp-native-transport-${Date.now()}`);
    await saveWhatsAppSession({
      mode: 'session',
      token: 'wa-token',
      phoneNumber: '+15551234567',
      createdAt: new Date().toISOString(),
    }, root);

    const transport = new WhatsAppNativeTransport({ ownPhoneNumber: '+15551234567' });
    const result = await transport.send({ to: '+15557654321', text: 'transport hello' }, root);
    expect(result.transport).toBe('native-session');

    const outbox = await listWhatsAppNativeOutbox(root);
    expect(outbox.some((item) => item.text === 'transport hello')).toBe(true);
  });
});
