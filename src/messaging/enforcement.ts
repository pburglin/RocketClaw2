import type { AppConfig } from '../config/load-config.js';

export function assertWhatsAppSendAllowed(config: AppConfig): void {
  const whatsapp = config.messaging.whatsapp;
  if (!whatsapp.enabled) {
    throw new Error('WhatsApp integration is disabled');
  }
}
