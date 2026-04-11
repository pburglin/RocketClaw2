import type { WhatsAppSessionProfile } from './whatsapp-session.js';

function maskToken(token: string): string {
  if (token.length <= 8) return '*'.repeat(token.length);
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export function formatWhatsAppSessionProfile(session: WhatsAppSessionProfile | null): string {
  if (!session) {
    return 'WhatsApp session profile: not configured';
  }

  return [
    'WhatsApp session profile',
    `Mode: ${session.mode}`,
    `Phone number: ${session.phoneNumber ?? 'n/a'}`,
    `Token: ${maskToken(session.token)}`,
    `Created at: ${session.createdAt}`,
    `Last used at: ${session.lastUsedAt ?? 'never'}`,
  ].join('\n');
}
