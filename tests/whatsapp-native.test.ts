import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { assertWhatsAppNativeReady, sendWhatsAppNativeMessage, shouldAcceptWhatsAppInbound } from '../src/messaging/whatsapp-native.js';
import { saveWhatsAppSession } from '../src/messaging/whatsapp-session.js';

describe('whatsapp native foundation', () => {
  it('requires a configured whatsapp session', async () => {
    await expect(assertWhatsAppNativeReady('/tmp/rc2-no-session')).rejects.toThrow('not configured');
  });

  it('enforces self-chat-only inbound policy by default', () => {
    expect(shouldAcceptWhatsAppInbound({ from: '+1', to: '+1', text: 'hi' }, { selfChatOnly: true, ownPhoneNumber: '+1' })).toBe(true);
    expect(shouldAcceptWhatsAppInbound({ from: '+2', to: '+1', text: 'hi' }, { selfChatOnly: true, ownPhoneNumber: '+1' })).toBe(false);
  });

  it('uses native-session send path when session exists', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-native-${Date.now()}`);
    await saveWhatsAppSession({ mode: 'session', token: 'tok', phoneNumber: '+15551234567', createdAt: new Date().toISOString() }, root);
    const result = await sendWhatsAppNativeMessage({ from: '+15551234567', to: '+15551234567', text: 'hello' }, root);
    expect(result.ok).toBe(true);
    expect(result.transport).toBe('native-session');
  });
});
