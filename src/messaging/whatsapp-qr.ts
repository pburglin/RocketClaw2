import { randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
import { saveWhatsAppSession } from './whatsapp-session.js';
import { getDefaultProjectRoot } from '../config/app-paths.js';
import { syncWhatsAppOwnPhoneNumber } from './whatsapp-config.js';

export type WhatsAppQrSession = {
  qrToken: string;
  qrText: string;
  qrDataUrl: string;
  createdAt: string;
};

export async function createWhatsAppQrSession(): Promise<WhatsAppQrSession> {
  const qrToken = randomUUID();
  const qrText = `whatsapp://link-device?token=${qrToken}`;
  const qrDataUrl = await QRCode.toDataURL(qrText, {
    margin: 2,
    width: 256,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
  return {
    qrToken,
    qrText,
    qrDataUrl,
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
  if (input.phoneNumber) {
    await syncWhatsAppOwnPhoneNumber(input.phoneNumber, root);
  }
}
