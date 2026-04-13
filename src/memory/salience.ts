export type MessageForSalience = {
  id: string;
  role: 'system' | 'user' | 'assistant';
  text: string;
  createdAt: string;
};

export function scoreMessageSalience(msg: MessageForSalience): number {
  const factors: SalienceFactors = {
    contentLength: msg.text.trim().length,
    recencyWeight: getRecencyWeight(msg.createdAt),
    keywordDensity: detectKeywordDensity(msg.text),
  };
  // Apply userFlagged bonus only for user messages that also contain high-value signals.
  // Pure conversational user messages don't get the boost (handled by recall scoring multiplier instead).
  // But user messages with durable facts/decisions/preferences do get priority.
  if (msg.role === 'user' && detectKeywordDensity(msg.text) >= 0.15) {
    factors.userFlagged = true;
  }
  return calculateSalienceScore(factors);
}

const HIGH_VALUE_PATTERNS = [
  /important|remember|don't forget|remind me|priority|critical|must|need to|should|have to/i,
  /bug|fix|error|fail|broken|issue|problem/i,
  /decide|decision|chose|choice|selected|agreed/i,
  /preference|prefer|like|dislike|enjoy|hate/i,
  /goal|plan|task|todo|action item/i,
  /question|help|confused|unclear|what if/i,
];

function detectKeywordDensity(text: string): number {
  let matches = 0;
  for (const pattern of HIGH_VALUE_PATTERNS) {
    if (pattern.test(text)) matches++;
  }
  return Math.min(matches / HIGH_VALUE_PATTERNS.length, 1);
}

export interface SalienceFactors {
  userFlagged?: boolean;
  contentLength: number;
  recencyWeight: number; // 0.0 to 1.0
  keywordDensity: number;
}

export function calculateSalienceScore(factors: SalienceFactors): number {
  let score = 0;

  // 1. User Importance (Strongest signal) - reduced bonus to avoid swamping semantic memory
  if (factors.userFlagged) score += 15;

  // 2. Information Density (Length as proxy, capped)
  const lengthScore = Math.min(factors.contentLength / 100, 20);
  score += lengthScore;

  // 3. Recency (Decay factor)
  score += factors.recencyWeight * 20;

  // 4. Keyword/Domain Value
  score += factors.keywordDensity * 10;

  return Math.min(score, 100);
}

export function getRecencyWeight(timestamp: string, now = new Date()): number {
  const diffMs = now.getTime() - new Date(timestamp).getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  // Half-life of 24 hours for recency decay
  return Math.pow(0.5, diffHours / 24);
}