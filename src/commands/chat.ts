import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import pc from 'picocolors';
import { appendMessage, createSession, loadSession } from '../sessions/store.js';
import { recallMemory } from '../memory/recall.js';
import type { AppConfig } from '../config/load-config.js';
import { runLlmQuery } from '../llm/client.js';

function buildFallbackReply(userText: string, recalled: Awaited<ReturnType<typeof recallMemory>>): string {
  if (recalled.length === 0) {
    return `Echo: ${userText}`;
  }

  const top = recalled.slice(0, 2).map((hit) => {
    if (hit.kind === 'semantic') {
      return `semantic memory: ${hit.text}`;
    }
    return `${hit.text} (from session "${hit.sessionTitle}")`;
  });

  return [`I heard: ${userText}`, 'Relevant memory:', ...top.map((item) => `- ${item}`)].join('\n');
}

async function buildAssistantReply(
  config: AppConfig,
  userText: string,
  recalled: Awaited<ReturnType<typeof recallMemory>>,
  llmOptions?: { stream?: boolean; onToken?: (chunk: string) => void },
): Promise<string> {
  if (!config.llm.apiKey) {
    return buildFallbackReply(userText, recalled);
  }

  const memoryBlock = recalled.length
    ? recalled
        .slice(0, 6)
        .map((hit) => (hit.kind === 'semantic' ? `Semantic memory: ${hit.text}` : `Session memory (${hit.sessionTitle}): ${hit.text}`))
        .join('\n')
    : 'No relevant memory found.';

  const prompt = [
    'You are RocketClaw2 chat.',
    'Answer the current user message helpfully using the provided memory context when relevant.',
    'If memory is relevant, use it naturally in the answer instead of just listing it back.',
    '',
    'Memory context:',
    memoryBlock,
    '',
    'User message:',
    userText,
  ].join('\n');

  return runLlmQuery(config, prompt, {
    channel: 'cli',
    label: 'chat reply',
    stream: llmOptions?.stream,
    onToken: llmOptions?.onToken,
  });
}

export async function runChatSession(options: { title?: string; sessionId?: string; config: AppConfig; stream?: boolean }): Promise<void> {
  const session = options.sessionId
    ? await loadSession(options.sessionId)
    : await createSession(options.title ?? 'Interactive Session');

  if (!session) {
    throw new Error(`Session not found: ${options.sessionId}`);
  }

  console.log(pc.cyan('━'.repeat(50)));
  console.log(pc.bold(`${pc.green('🚀 RocketClaw2')}`) + pc.white(' chat session'));
  console.log(pc.gray(`Session: ${session.title}  [${session.id}]`));
  console.log(pc.cyan('━'.repeat(50)));
  console.log(pc.dim('Type ') + pc.yellow('/exit') + pc.dim(' to quit, ') + pc.yellow('/help') + pc.dim(' for commands.'));
  console.log('');

  const rl = readline.createInterface({ input, output });

  try {
    while (true) {
      let line = '';
      try {
        line = (await rl.question(pc.blue('you> '))).trim();
      } catch (error) {
        const err = error as { code?: string };
        if (err?.code === 'ABORT_ERR') {
          console.log(pc.dim('\nGot signal, exiting cleanly.'));
          break;
        }
        throw error;
      }
      if (!line) continue;
      if (line === '/exit') break;

      // Built-in commands
      if (line === '/help') {
        console.log(pc.dim('Available commands:'));
        console.log(`  ${pc.yellow('/exit')}  - end this session`);
        console.log(`  ${pc.yellow('/help')} - show this message`);
        console.log(`  ${pc.yellow('/mem')}  - show recalled memory so far (last message)`);
        continue;
      }
      if (line === '/mem') {
        const lastUserMsg = session.messages.filter((m) => m.role === 'user').at(-1);
        if (!lastUserMsg) {
          console.log(pc.dim('No user messages yet.'));
        } else {
          const recalled = await recallMemory(lastUserMsg.text);
          if (recalled.length === 0) {
            console.log(pc.dim('No memory recalled for your last message.'));
          } else {
            console.log(pc.dim(`Memory for "${lastUserMsg.text}":`));
            for (const hit of recalled.slice(0, 5)) {
              const label = hit.kind === 'semantic' ? pc.cyan('[semantic]') : pc.gray(`[session]`);
              console.log(`  ${label} ${hit.text}`);
            }
          }
        }
        continue;
      }

      await appendMessage(session.id, 'user', line);
      const recalled = await recallMemory(line);
      let streamed = false;
      const reply = await buildAssistantReply(options.config, line, recalled, options.config.llm.apiKey
        ? {
            stream: options.stream,
            onToken: options.stream ? ((chunk) => {
              if (!streamed) {
                process.stdout.write(pc.green('assistant> '));
                streamed = true;
              }
              process.stdout.write(chunk);
            }) : undefined,
          }
        : undefined);
      await appendMessage(session.id, 'assistant', reply);
      if (streamed) {
        process.stdout.write('\n');
      } else {
        console.log(pc.green('assistant> ') + reply);
      }
    }
  } finally {
    rl.close();
    console.log(pc.dim(`\nSession saved: ${session.id}`));
  }
}
