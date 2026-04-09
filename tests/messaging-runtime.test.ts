import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config/load-config.js';
import { runGovernedMessageSend } from '../src/messaging/runtime.js';

describe('runGovernedMessageSend', () => {
  it('requires approval for governed whatsapp sends when not in yolo mode', async () => {
    const config = loadConfig({ messaging: { whatsapp: { enabled: true, mode: 'mock', defaultRecipient: '+15551234567' } } });
    await expect(runGovernedMessageSend(config, { channel: 'whatsapp', text: 'hello', approved: false })).rejects.toThrow();
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
