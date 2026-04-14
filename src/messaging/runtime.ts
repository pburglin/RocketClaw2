import type { AppConfig } from '../config/load-config.js';
import { assertWhatsAppSendAllowed } from './enforcement.js';
import { createDefaultChannelRegistry } from './index.js';
import type { MessageSendResult } from './types.js';
import { createApprovalRequest } from '../approval/store.js';
import { runWithQueue } from '../queue/runtime.js';

export async function runGovernedMessageSend(
  config: AppConfig,
  input: { channel: string; to?: string; text: string; approved?: boolean },
  root?: string,
): Promise<MessageSendResult> {
  if (input.channel === 'whatsapp') {
    assertWhatsAppSendAllowed(config);
    if (!input.approved && !config.yolo.enabled) {
      const approval = await createApprovalRequest({
        kind: 'message-send',
        target: input.channel,
        detail: `Approval required for governed ${input.channel} send`,
      }, root);
      throw new Error(`Governed messaging send requires explicit approval unless yolo mode is enabled. Approval request created: ${approval.id}`);
    }
    if (!input.approved && config.yolo.enabled && config.yolo.warn) {
      console.warn('[YOLO WARNING] Auto-approving governed WhatsApp send.');
    }
  }

  // If LLM is rate-limited, queue the outbound message processing
  if (input.text.length > 0) {
    const queueResult = await runWithQueue(
      config,
      { channel: input.channel },
      input.text,
    );
    if (queueResult.queued) {
      return {
        ok: true,
        channel: input.channel,
        to: input.to || '',
        messageId: queueResult.error || 'queued',
        queued: true,
      };
    }
  }

  const registry = createDefaultChannelRegistry(config.messaging, root);
  const plugin = registry.get(input.channel);
  if (!plugin) {
    throw new Error(`Unknown channel: ${input.channel}`);
  }

  const destination = input.to || config.messaging.whatsapp.defaultRecipient;
  if (!destination) {
    throw new Error('No destination provided and no default recipient configured');
  }

  return plugin.send({ to: destination, text: input.text });
}
