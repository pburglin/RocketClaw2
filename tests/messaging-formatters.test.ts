import { describe, expect, it } from 'vitest';
import { formatMessagingSummary } from '../src/messaging/formatters.js';

describe('formatMessagingSummary', () => {
  it('renders a readable messaging summary', () => {
    const summary = formatMessagingSummary({
      whatsapp: {
        enabled: true,
        mode: 'webhook',
        webhookUrl: 'https://example.com/hook',
        defaultRecipient: '+15551234567',
        selfChatOnly: true,
      },
    }, {
      whatsappSession: {
        mode: 'session',
        token: 'session-token-123456',
        phoneNumber: '+15557654321',
        createdAt: '2026-04-10T20:00:00.000Z',
        lastUsedAt: '2026-04-10T20:05:00.000Z',
      },
    });
    expect(summary).toContain('WhatsApp enabled: yes');
    expect(summary).toContain('Webhook configured: yes');
    expect(summary).toContain('Session configured: yes');
    expect(summary).toContain('Session phone number: +15557654321');
  });
});
