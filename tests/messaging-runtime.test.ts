import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadConfig } from '../src/config/load-config.js';
import { runGovernedMessageSend } from '../src/messaging/runtime.js';
import { loadApprovals } from '../src/approval/store.js';

describe('runGovernedMessageSend', () => {
  it('requires approval for governed whatsapp sends when not in yolo mode', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-msg-runtime-${Date.now()}`);
    const config = loadConfig({ messaging: { whatsapp: { enabled: true, mode: 'mock', defaultRecipient: '+15551234567' } } });
    await expect(runGovernedMessageSend(config, { channel: 'whatsapp', text: 'hello', approved: false }, root)).rejects.toThrow();

    const approvals = await loadApprovals(root);
    expect(approvals).toHaveLength(1);

    await fs.rm(root, { recursive: true, force: true });
  });

  it('allows governed whatsapp sends in yolo mode with warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const config = loadConfig({
      yolo: { enabled: true, warn: true },
      messaging: { whatsapp: { enabled: true, mode: 'mock', defaultRecipient: '+15551234567' } },
    });
    const result = await runGovernedMessageSend(config, { channel: 'whatsapp', text: 'hello', approved: false });
    expect(result.ok).toBe(true);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
