import type { InboundMessage, NativeMessageTransport, OutboundMessage, TransportSendResult } from './transport.js';
import { loadWhatsAppSession } from './whatsapp-session.js';

export type WhatsAppNativeConfig = {
  selfChatOnly?: boolean;
  ownPhoneNumber?: string;
};

export class WhatsAppNativeTransport implements NativeMessageTransport {
  readonly id = 'whatsapp-native';

  constructor(private readonly config: WhatsAppNativeConfig = {}) {}

  async assertReady(root?: string): Promise<void> {
    await assertWhatsAppNativeReady(root);
  }

  shouldAcceptInbound(message: InboundMessage): boolean {
    return shouldAcceptWhatsAppInbound(message, this.config);
  }

  async send(message: OutboundMessage, root?: string): Promise<TransportSendResult> {
    return sendWhatsAppNativeMessage({ from: this.config.ownPhoneNumber ?? 'unknown', to: message.to, text: message.text, chatId: message.chatId }, root);
  }
}

export async function assertWhatsAppNativeReady(root?: string): Promise<{ phoneNumber?: string }> {
  const session = await loadWhatsAppSession(root);
  if (!session || !session.token) {
    throw new Error('WhatsApp native session is not configured');
  }
  return { phoneNumber: session.phoneNumber };
}

export function shouldAcceptWhatsAppInbound(
  message: InboundMessage,
  config: WhatsAppNativeConfig,
): boolean {
  if (!config.selfChatOnly) return true;
  if (!config.ownPhoneNumber) return false;
  return message.from === config.ownPhoneNumber && message.to === config.ownPhoneNumber;
}

export async function sendWhatsAppNativeMessage(
  message: InboundMessage,
  root?: string,
): Promise<{ ok: boolean; transport: 'native-session'; detail: string }> {
  const session = await assertWhatsAppNativeReady(root);
  return {
    ok: true,
    transport: 'native-session',
    detail: `native-session:${session.phoneNumber ?? 'unknown'}:${message.to}:${message.text}`,
  };
}
