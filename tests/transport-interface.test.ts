import { describe, expect, it } from 'vitest';
import { WhatsAppNativeTransport } from '../src/messaging/whatsapp-native.js';

describe('native transport foundation', () => {
  it('implements inbound self-chat filtering semantics', () => {
    const transport = new WhatsAppNativeTransport({ selfChatOnly: true, ownPhoneNumber: '+1555' });
    expect(transport.shouldAcceptInbound({ from: '+1555', to: '+1555', text: 'hi' })).toBe(true);
    expect(transport.shouldAcceptInbound({ from: '+1666', to: '+1555', text: 'hi' })).toBe(false);
  });
});
