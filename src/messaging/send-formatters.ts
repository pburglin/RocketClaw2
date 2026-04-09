import type { MessageSendResult } from './types.js';

export function formatSendResult(result: MessageSendResult): string {
  return [
    `Channel: ${result.channel}`,
    `To: ${result.to}`,
    `Status: ${result.ok ? 'ok' : 'failed'}`,
    `Transport ID: ${result.transportId ?? 'n/a'}`,
    `Detail: ${result.detail ?? 'n/a'}`,
  ].join('\n');
}
