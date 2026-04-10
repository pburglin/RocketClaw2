import { loadAppConfig } from '../tools/config-store.js';
import { createDefaultChannelRegistry } from './index.js';

export async function sendWhatsAppAutoReply(input: { to: string; text: string }, root?: string): Promise<{ ok: boolean; detail: string }> {
  const config = await loadAppConfig(root);
  const registry = createDefaultChannelRegistry(config.messaging);
  const plugin = registry.get('whatsapp');
  if (!plugin) {
    throw new Error('WhatsApp plugin is not configured');
  }
  const result = await plugin.send({ to: input.to, text: input.text });
  return { ok: result.ok, detail: result.detail ?? '' };
}
