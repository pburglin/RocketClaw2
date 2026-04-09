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
      },
    });
    expect(summary).toContain('WhatsApp enabled: yes');
    expect(summary).toContain('Webhook configured: yes');
  });
});
