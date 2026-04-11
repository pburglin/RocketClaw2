import { getDefaultProjectRoot } from '../config/app-paths.js';
import { dispatchWhatsAppInbound } from './whatsapp-dispatcher.js';
import { ingestWhatsAppInboundToSession } from './whatsapp-session-bridge.js';
import type { WhatsAppNativeTransport } from './whatsapp-native.js';
import type { WhatsAppInboundEvent } from './whatsapp-listener.js';

export type NativeInboundProcessResult = {
  accepted: boolean;
  reason?: string;
  sessionId?: string;
  dispatched?: Awaited<ReturnType<typeof dispatchWhatsAppInbound>>;
};

export async function processNativeWhatsAppInbound(
  transport: WhatsAppNativeTransport,
  event: WhatsAppInboundEvent,
  root = getDefaultProjectRoot(),
): Promise<NativeInboundProcessResult> {
  const accepted = transport.shouldAcceptInbound({
    from: event.from,
    to: event.raw && typeof event.raw === 'object' && 'to' in (event.raw as Record<string, unknown>)
      ? String((event.raw as Record<string, unknown>).to ?? '')
      : event.from,
    text: event.text,
    chatId: event.raw && typeof event.raw === 'object' && 'chatId' in (event.raw as Record<string, unknown>)
      ? String((event.raw as Record<string, unknown>).chatId ?? '')
      : undefined,
    receivedAt: event.receivedAt,
  });

  if (!accepted) {
    return { accepted: false, reason: 'filtered-by-self-chat-policy' };
  }

  const session = await ingestWhatsAppInboundToSession(event, root);
  const dispatched = await dispatchWhatsAppInbound(event);
  return { accepted: true, sessionId: session.sessionId, dispatched };
}
