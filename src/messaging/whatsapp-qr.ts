import { randomUUID } from 'node:crypto';
import { saveWhatsAppSession } from './whatsapp-session.js';
import { getDefaultProjectRoot } from '../config/app-paths.js';

export type WhatsAppQrSession = {
  qrToken: string;
  qrText: string;
  createdAt: string;
};

export function createWhatsAppQrSession(): WhatsAppQrSession {
  const qrToken = randomUUID();
  return {
    qrToken,
    qrText: `whatsapp://link-device?token=${qrToken}`,
    createdAt: new Date().toISOString(),
  };
}

export async function authorizeWhatsAppQrToken(
  input: { qrToken: string; phoneNumber?: string },
  root = getDefaultProjectRoot(),
): Promise<void> {
  await saveWhatsAppSession({
    mode: 'session',
    token: input.qrToken,
    phoneNumber: input.phoneNumber,
    createdAt: new Date().toISOString(),
  }, root);
}
