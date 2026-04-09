import { describe, expect, it } from 'vitest';
import { createDefaultChannelRegistry } from '../src/messaging/index.js';

describe('channel registry', () => {
  it('registers whatsapp as the default messaging plugin', async () => {
    const registry = createDefaultChannelRegistry();
    const plugin = registry.get('whatsapp');
    expect(plugin).toBeDefined();
    const result = await plugin!.send({ to: '+15551234567', text: 'hello' });
    expect(result.ok).toBe(true);
    expect(result.channel).toBe('whatsapp');
  });
});
