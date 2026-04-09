import type { SessionMessage } from '../sessions/types.js';

export function scoreMessageSalience(message: SessionMessage): number {
  const text = message.text.trim();
  let score = 0;

  if (message.role === 'user') score += 10;
  if (text.length > 80) score += 10;
  if (/decision|prefer|remember|important|todo|plan|deadline|commitment/i.test(text)) score += 25;
  if (/password|secret|token|key/i.test(text)) score -= 15;
  if (/[!?]/.test(text)) score += 5;

  return Math.max(score, 0);
}
