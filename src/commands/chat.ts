import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { appendMessage, createSession, loadSession } from '../sessions/store.js';
import { recallMemory, type RecallHit } from '../memory/recall.js';

function formatRecallHit(hit: RecallHit): string {
  if (hit.kind === 'semantic') {
    return hit.text;
  }
  return `${hit.text} (from session "${hit.sessionTitle}")`;
}

function looksLikeMemoryQuestion(userText: string): boolean {
  const q = userText.trim().toLowerCase();
  return q.includes('remember') || q.includes('recall') || q.includes('what do you know');
}

export function buildAssistantReply(userText: string, recalled: RecallHit[]): string {
  const trimmed = userText.trim();
  if (recalled.length === 0) {
    if (looksLikeMemoryQuestion(trimmed)) {
      return "I couldn't find anything relevant in memory yet.";
    }
    return `I heard: ${trimmed}`;
  }

  const top = recalled.slice(0, 2).map(formatRecallHit);

  if (looksLikeMemoryQuestion(trimmed)) {
    return [`Here's what I found in memory:`, ...top.map((item) => `- ${item}`)].join('\n');
  }

  return [`I heard: ${trimmed}`, 'Relevant memory:', ...top.map((item) => `- ${item}`)].join('\n');
}

export async function runChatSession(options: { title?: string; sessionId?: string }): Promise<void> {
  const session = options.sessionId
    ? await loadSession(options.sessionId)
    : await createSession(options.title ?? 'Interactive Session');

  if (!session) {
    throw new Error(`Session not found: ${options.sessionId}`);
  }

  console.log(`RocketClaw2 chat session: ${session.title}`);
  console.log(`Session ID: ${session.id}`);
  console.log('Type /exit to quit.');

  const rl = readline.createInterface({ input, output });

  try {
    while (true) {
      const line = (await rl.question('you> ')).trim();
      if (!line) continue;
      if (line === '/exit') break;

      await appendMessage(session.id, 'user', line);
      const recalled = await recallMemory(line);
      const reply = buildAssistantReply(line, recalled);
      await appendMessage(session.id, 'assistant', reply);
      console.log(`assistant> ${reply}`);
    }
  } finally {
    rl.close();
  }
}
