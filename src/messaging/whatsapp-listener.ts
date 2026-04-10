import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getDefaultProjectRoot } from '../config/app-paths.js';
import { ingestWhatsAppInboundToSession } from './whatsapp-session-bridge.js';
import { dispatchWhatsAppInbound } from './whatsapp-dispatcher.js';

export type WhatsAppInboundEvent = {
  type: 'message';
  from: string;
  text: string;
  receivedAt: string;
  raw?: unknown;
};

function getInboxPath(root = getDefaultProjectRoot()): string {
  return path.join(root, 'state', 'whatsapp-inbox.jsonl');
}

export async function appendWhatsAppInbound(event: WhatsAppInboundEvent, root = getDefaultProjectRoot()): Promise<void> {
  const filePath = getInboxPath(root);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(event)}\n`, 'utf8');
}

export async function listWhatsAppInbound(root = getDefaultProjectRoot()): Promise<WhatsAppInboundEvent[]> {
  const filePath = getInboxPath(root);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return raw.split('\n').filter(Boolean).map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

export async function startWhatsAppWebhookListener(input?: { port?: number; root?: string }): Promise<http.Server> {
  const port = input?.port ?? 8787;
  const root = input?.root ?? getDefaultProjectRoot();

  const server = http.createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/whatsapp/webhook') {
      res.statusCode = 404;
      res.end('not found');
      return;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString('utf8');

    try {
      const payload = JSON.parse(body);
      const event: WhatsAppInboundEvent = {
        type: 'message',
        from: String(payload.from ?? 'unknown'),
        text: String(payload.text ?? ''),
        receivedAt: new Date().toISOString(),
        raw: payload,
      };
      await appendWhatsAppInbound(event, root);
      const session = await ingestWhatsAppInboundToSession(event, root);
      const dispatched = await dispatchWhatsAppInbound(event);
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, sessionId: session.sessionId, createdSession: session.created, dispatched }));
    } catch (error) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    }
  });

  await new Promise<void>((resolve) => server.listen(port, resolve));
  return server;
}
