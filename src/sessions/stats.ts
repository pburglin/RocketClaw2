import { listSessions } from './store.js';
import { getDefaultProjectRoot } from '../config/app-paths.js';

export type SessionStats = {
  sessionCount: number;
  messageCount: number;
  userMessages: number;
  assistantMessages: number;
  systemMessages: number;
  latestUpdatedAt: string | null;
};

export async function getSessionStats(root = getDefaultProjectRoot()): Promise<SessionStats> {
  const sessions = await listSessions(root);
  let messageCount = 0;
  let userMessages = 0;
  let assistantMessages = 0;
  let systemMessages = 0;
  let latestUpdatedAt: string | null = null;

  for (const session of sessions) {
    if (!latestUpdatedAt || session.updatedAt > latestUpdatedAt) latestUpdatedAt = session.updatedAt;
    for (const message of session.messages) {
      messageCount += 1;
      if (message.role === 'user') userMessages += 1;
      if (message.role === 'assistant') assistantMessages += 1;
      if (message.role === 'system') systemMessages += 1;
    }
  }

  return {
    sessionCount: sessions.length,
    messageCount,
    userMessages,
    assistantMessages,
    systemMessages,
    latestUpdatedAt,
  };
}
