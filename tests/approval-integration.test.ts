import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { configureWhatsApp } from '../src/messaging/whatsapp-config.js';
import { loadAppConfig } from '../src/tools/config-store.js';
import { runGovernedMessageSend } from '../src/messaging/runtime.js';
import { loadApprovals } from '../src/approval/store.js';

describe('approval auto-creation integration', () => {
  it('creates an approval request in the provided runtime root when governed messaging lacks approval', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-approval-int-${Date.now()}`);
    await configureWhatsApp({ enabled: true, mode: 'mock', defaultRecipient: '+15551234567' }, root);
    const config = await loadAppConfig(root);

    await expect(runGovernedMessageSend(config, { channel: 'whatsapp', text: 'hello', approved: false }, root)).rejects.toThrow();

    const approvals = await loadApprovals(root);
    expect(approvals).toHaveLength(1);
    expect(approvals[0]?.kind).toBe('message-send');
    expect(approvals[0]?.target).toBe('whatsapp');

    await fs.rm(root, { recursive: true, force: true });
  });
});
