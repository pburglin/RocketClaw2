import { loadAppConfig, saveAppConfig } from '../tools/config-store.js';
import { getDefaultProjectRoot } from '../config/app-paths.js';

export async function configureWhatsApp(
  input: {
    enabled?: boolean;
    mode?: 'mock' | 'webhook' | 'session';
    webhookUrl?: string;
    defaultRecipient?: string;
    selfChatOnly?: boolean;
    ownPhoneNumber?: string;
  },
  root = getDefaultProjectRoot(),
) {
  const config = await loadAppConfig(root);
  const next = {
    ...config,
    messaging: {
      ...config.messaging,
      whatsapp: {
        ...config.messaging.whatsapp,
        ...input,
      },
    },
  };
  await saveAppConfig(next, root);
  return next.messaging.whatsapp;
}

export async function syncWhatsAppOwnPhoneNumber(phoneNumber: string, root = getDefaultProjectRoot()) {
  const config = await loadAppConfig(root);
  if (config.messaging.whatsapp.ownPhoneNumber === phoneNumber) {
    return config.messaging.whatsapp;
  }
  return configureWhatsApp({ ownPhoneNumber: phoneNumber }, root);
}
