import type { MessageChannelPlugin, MessageSendRequest, MessageSendResult } from '../types.js';

export type WhatsAppPluginOptions = {
  mode?: 'mock' | 'webhook';
  webhookUrl?: string;
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

    return {
      ok: true,
      channel: this.id,
      to: request.to,
      transportId: `mock-whatsapp-${Date.now()}`,
      detail: request.text,
    };
  }
}
