import { describe, expect, it } from 'vitest';
import { dispatchWhatsAppInbound } from '../src/messaging/whatsapp-dispatcher.js';

describe('whatsapp dispatcher', () => {
  it('dispatches workspace status requests', async () => {
    const result = await dispatchWhatsAppInbound({
      type: 'message',
      from: '+15551234567',
      text: 'status',
      receivedAt: new Date().toISOString(),
    });
    expect(result.matched).toBe(true);
    expect(result.command).toBe('workspace-status');
    expect(result.replyText).toContain('RocketClaw2 Workspace Status');
  });

  it('dispatches next-actions requests', async () => {
    const result = await dispatchWhatsAppInbound({
      type: 'message',
      from: '+15551234567',
      text: 'next-actions',
      receivedAt: new Date().toISOString(),
    });
    expect(result.matched).toBe(true);
    expect(result.command).toBe('next-actions');
  });
});
