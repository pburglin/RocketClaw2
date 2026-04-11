import type { MessageChannelPlugin, MessageSendRequest, MessageSendResult } from '../types.js';
import { loadWhatsAppSession, touchWhatsAppSession } from '../whatsapp-session.js';

export type WhatsAppPluginOptions = {
  mode?: 'mock' | 'webhook' | 'session';
  webhookUrl?: string;
  root?: string;
};

export class WhatsAppChannelPlugin implements MessageChannelPlugin {
  readonly id = 'whatsapp';
  readonly label = 'WhatsApp';

  constructor(private readonly options: WhatsAppPluginOptions = { mode: 'mock' }) {}

  async send(request: MessageSendRequest): Promise<MessageSendResult> {
    if (this.options.mode === 'webhook' && this.options.webhookUrl) {
      const response = await fetch(this.options.webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channel: this.id, to: request.to, text: request.text, metadata: request.metadata ?? {} }),
      });
      return {
        ok: response.ok,
        channel: this.id,
        to: request.to,
        detail: `webhook:${response.status}`,
      };
    }

    if (this.options.mode === 'session') {
      const session = await loadWhatsAppSession(this.options.root);
      if (!session || !session.token) {
        throw new Error('WhatsApp session mode is enabled but no local WhatsApp session profile is configured');
      }
      const touched = await touchWhatsAppSession(this.options.root);
      return {
        ok: true,
        channel: this.id,
        to: request.to,
        transportId: `session-whatsapp-${Date.now()}`,
        detail: `session:${session.phoneNumber ?? 'unknown'}:${request.text}:lastUsed=${touched?.lastUsedAt ?? 'unknown'}`,
      };
    }

    return {
      ok: true,
      channel: this.id,
      to: request.to,
      transportId: `mock-whatsapp-${Date.now()}`,
      detail: request.text,
    };
  }
}
