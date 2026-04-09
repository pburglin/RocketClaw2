import type { MessagingConfig } from './config.js';

export function formatMessagingSummary(config: MessagingConfig): string {
  const whatsapp = config.whatsapp;
  return [
    'Messaging summary',
    `WhatsApp enabled: ${whatsapp.enabled ? 'yes' : 'no'}`,
    `WhatsApp mode: ${whatsapp.mode}`,
    `Default recipient: ${whatsapp.defaultRecipient ?? 'n/a'}`,
    `Webhook configured: ${whatsapp.webhookUrl ? 'yes' : 'no'}`,
  ].join('\n');
}
