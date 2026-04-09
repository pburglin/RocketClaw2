import { describe, expect, it } from 'vitest';
import { formatSendResult } from '../src/messaging/send-formatters.js';

describe('formatSendResult', () => {
  it('formats messaging results for operator readability', () => {
    const text = formatSendResult({ ok: true, channel: 'whatsapp', to: '+15551234567', transportId: 'abc', detail: 'hello' });
    expect(text).toContain('Channel: whatsapp');
    expect(text).toContain('Status: ok');
  });
});
