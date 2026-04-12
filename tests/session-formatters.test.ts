import { describe, expect, it } from 'vitest';
import { formatWhatsAppSessionProfile } from '../src/messaging/session-formatters.js';

describe('formatWhatsAppSessionProfile', () => {
  it('renders a readable whatsapp session summary with masked token', () => {
    const text = formatWhatsAppSessionProfile({
      mode: 'session',
      token: 'session-token-123456',
      phoneNumber: '+15551234567',
      createdAt: '2026-04-10T20:00:00.000Z',
      lastUsedAt: '2026-04-10T20:05:00.000Z',
    });

    expect(text).toContain('WhatsApp session profile');
    expect(text).toContain('Phone number: +15551234567');
    expect(text).toContain('Token: sess...3456');
    expect(text).toContain('Last used at: 2026-04-10T20:05:00.000Z');
  });

  it('handles an unconfigured session profile', () => {
    expect(formatWhatsAppSessionProfile(null)).toContain('not configured');
  });
});
