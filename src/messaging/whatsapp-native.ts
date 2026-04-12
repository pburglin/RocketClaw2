import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { getDefaultProjectRoot } from '../config/app-paths.js';
import type { InboundMessage, NativeMessageTransport, OutboundMessage, TransportSendResult } from './transport.js';
import { loadWhatsAppSession } from './whatsapp-session.js';

export type WhatsAppNativeConfig = {
  selfChatOnly?: boolean;
  ownPhoneNumber?: string;
};

export type WhatsAppNativeOutboundRecord = {
  id: string;
  from: string;
  to: string;
  text: string;
  chatId?: string;
  transport: 'native-session';
  createdAt: string;
};

function getNativeOutboxPath(root = getDefaultProjectRoot()): string {
  return path.join(root, 'state', 'whatsapp-native-outbox.json');
}

async function loadNativeOutbox(root?: string): Promise<WhatsAppNativeOutboundRecord[]> {
  const filePath = getNativeOutboxPath(root);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function appendNativeOutbox(record: WhatsAppNativeOutboundRecord, root?: string): Promise<void> {
  const filePath = getNativeOutboxPath(root);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const current = await loadNativeOutbox(root);
  current.push(record);
  await fs.writeFile(filePath, JSON.stringify(current, null, 2), 'utf8');
}

export class WhatsAppNativeTransport implements NativeMessageTransport {
  readonly id = 'whatsapp-native';

  constructor(private readonly config: WhatsAppNativeConfig = { selfChatOnly: true }) {}

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

export function shouldAllowWhatsAppOutbound(
  message: Pick<InboundMessage, 'to'>,
  config: WhatsAppNativeConfig,
): boolean {
  if (!config.selfChatOnly) return true;
  if (!config.ownPhoneNumber) return false;
  return message.to === config.ownPhoneNumber;
}

export async function sendWhatsAppNativeMessage(
  message: InboundMessage,
  root?: string,
): Promise<{ ok: boolean; transport: 'native-session'; detail: string }> {
  const session = await assertWhatsAppNativeReady(root);
  const record: WhatsAppNativeOutboundRecord = {
    id: randomUUID(),
    from: session.phoneNumber ?? message.from,
    to: message.to,
    text: message.text,
    chatId: message.chatId,
    transport: 'native-session',
    createdAt: new Date().toISOString(),
  };
  await appendNativeOutbox(record, root);
  return {
    ok: true,
    transport: 'native-session',
    detail: `native-session:${record.from}:${record.to}:${record.text}`,
  };
}

export async function listWhatsAppNativeOutbox(root?: string): Promise<WhatsAppNativeOutboundRecord[]> {
  const items = await loadNativeOutbox(root);
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
