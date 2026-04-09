import { ChannelRegistry } from './channel-registry.js';
import { WhatsAppChannelPlugin } from './channels/whatsapp.js';
import type { MessagingConfig } from './config.js';

export function createDefaultChannelRegistry(config?: MessagingConfig): ChannelRegistry {
  const registry = new ChannelRegistry();
  const whatsapp = config?.whatsapp;
  if (whatsapp?.enabled !== false) {
    registry.register(
      new WhatsAppChannelPlugin({
        mode: whatsapp?.mode ?? 'mock',
        webhookUrl: whatsapp?.webhookUrl,
      }),
    );
  }
  return registry;
}
