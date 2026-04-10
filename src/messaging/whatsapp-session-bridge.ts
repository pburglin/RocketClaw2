import { appendMessage, createSession, listSessions } from '../sessions/store.js';
import type { WhatsAppInboundEvent } from './whatsapp-listener.js';
import { getDefaultProjectRoot } from '../config/app-paths.js';

function titleForSender(from: string): string {
  return `WhatsApp ${from}`;
}

export async function ingestWhatsAppInboundToSession(
  event: WhatsAppInboundEvent,
  root = getDefaultProjectRoot(),
): Promise<{ sessionId: string; created: boolean }> {
  const title = titleForSender(event.from);
  const sessions = await listSessions(root);
  let session = sessions.find((item) => item.title === title) ?? null;
  let created = false;

  if (!session) {
    session = await createSession(title, root);
    created = true;
  }

  await appendMessage(session.id, 'user', event.text, root);
  return { sessionId: session.id, created };
}
