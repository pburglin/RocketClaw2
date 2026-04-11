import type { MessagingConfig } from './config.js';
import type { WhatsAppSessionProfile } from './whatsapp-session.js';

export function formatMessagingSummary(config: MessagingConfig, options?: { whatsappSession?: WhatsAppSessionProfile | null }): string {
  const whatsapp = config.whatsapp;
  const session = options?.whatsappSession;
  return [
    'Messaging summary',
    `WhatsApp enabled: ${whatsapp.enabled ? 'yes' : 'no'}`,
    `WhatsApp mode: ${whatsapp.mode}`,
    `Default recipient: ${whatsapp.defaultRecipient ?? 'n/a'}`,
    `Webhook configured: ${whatsapp.webhookUrl ? 'yes' : 'no'}`,
    `Session configured: ${session?.token ? 'yes' : 'no'}`,
    `Session phone number: ${session?.phoneNumber ?? 'n/a'}`,
    `Session last used: ${session?.lastUsedAt ?? 'never'}`,
  ].join('\n');
}
