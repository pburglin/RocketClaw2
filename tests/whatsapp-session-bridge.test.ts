import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { ingestWhatsAppInboundToSession } from '../src/messaging/whatsapp-session-bridge.js';
import { loadSession, listSessions } from '../src/sessions/store.js';

describe('whatsapp session bridge', () => {
  it('creates or reuses a session for inbound whatsapp messages', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-wa-session-${Date.now()}`);
    const first = await ingestWhatsAppInboundToSession({
      type: 'message',
      from: '+15551234567',
      text: 'hello from whatsapp',
      receivedAt: new Date().toISOString(),
    }, root);

    expect(first.created).toBe(true);
    const sessions = await listSessions(root);
    expect(sessions).toHaveLength(1);
    const loaded = await loadSession(first.sessionId, root);
    expect(loaded?.messages[0]?.text).toBe('hello from whatsapp');

    const second = await ingestWhatsAppInboundToSession({
      type: 'message',
      from: '+15551234567',
      text: 'second message',
      receivedAt: new Date().toISOString(),
    }, root);

    expect(second.created).toBe(false);
    const loadedAgain = await loadSession(first.sessionId, root);
    expect(loadedAgain?.messages).toHaveLength(2);
  });
});
