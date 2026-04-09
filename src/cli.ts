#!/usr/bin/env node
import { Command } from 'commander';
import { getRuntimeSummary } from './core/runtime.js';
import { loadConfig, loadConfigFromDisk } from './config/load-config.js';
import { CORE_TOOL_CATALOG, ToolAccessLevelSchema } from './tools/catalog.js';
import { describeToolRiskPosture } from './tools/policy.js';
import { formatToolPolicies, formatToolPolicySummary } from './tools/formatters.js';
import { loadAppConfig, setToolPolicy } from './tools/config-store.js';
import { assertToolAccess } from './tools/enforcement.js';
import { runToolWithPolicy } from './tools/runtime.js';
import { describeOverrideWarning } from './tools/override.js';
import { runInit } from './commands/init.js';
import { getMemoryStrategy } from './memory/strategy.js';
import { searchSessionMemory } from './memory/retrieval.js';
import { recallMemory } from './memory/recall.js';
import { formatRecallHits, formatRecallSummary } from './memory/formatters.js';
import { formatSemanticMemoryFiltered, formatSemanticMemorySummary } from './memory/semantic-formatters.js';
import { buildConsolidationPlan } from './memory/consolidation.js';
import { rememberCandidate } from './memory/remember.js';
import { loadSemanticMemory } from './memory/semantic-store.js';
import { createDefaultChannelRegistry } from './messaging/index.js';
import { configureWhatsApp } from './messaging/whatsapp-config.js';
import { formatMessagingSummary } from './messaging/formatters.js';
import { assertWhatsAppSendAllowed } from './messaging/enforcement.js';
import { formatSendResult } from './messaging/send-formatters.js';
import { runGovernedMessageSend } from './messaging/runtime.js';
import { resolveRalphPreset, runRalphLoop } from './loops/ralph.js';
import { formatRalphLoopResult } from './loops/ralph-formatters.js';
import { configureYolo } from './config/yolo-config.js';
import { buildSystemSummary, formatSystemSummary } from './config/system-summary.js';
import { getCliTuiRoadmap } from './tui/roadmap.js';
import { formatRecallScoringExplanation, formatSemanticMemory, formatSessionDetail, formatSessionStats, formatSessionSummary } from './tui/formatters.js';
import { appendMessage, createSession, listSessions, loadSession } from './sessions/store.js';
import { getSessionStats } from './sessions/stats.js';
import { runChatSession } from './commands/chat.js';

const program = new Command();

program
  .name('rocketclaw2')
  .description('RocketClaw2, a Node.js and TypeScript reimplementation of RocketClaw')
  .version('0.1.0');


program
  .command('init')
  .description('Initialize RocketClaw2 local config, state, and memory directories')
  .option('--profile <name>', 'config profile', 'default')
  .action(async (options) => {
    await runInit(options.profile);
  });





program
  .command('recall')
  .description('Search across session memory and curated semantic memory')
  .requiredOption('--query <text>', 'text to recall')
  .option('--json', 'output raw JSON')
  .option('--kind <kind>', 'filter by semantic|session')
  .option('--summary', 'show only aggregate summary')
  .action(async (options) => {
    let hits = await recallMemory(options.query);
    if (options.kind) {
      hits = hits.filter((hit) => hit.kind === options.kind);
    }
    if (options.json) {
      console.log(JSON.stringify(hits, null, 2));
      return;
    }
    console.log(options.summary ? formatRecallSummary(hits) : formatRecallHits(hits));
  });

program
  .command('memory-list')
  .description('List curated semantic memory entries')
  .option('--json', 'output raw JSON')
  .option('--tag <tag>', 'filter by tag')
  .option('--min-salience <n>', 'filter by minimum salience')
  .option('--summary', 'show aggregate summary')
  .action(async (options) => {
    let entries = await loadSemanticMemory();
    if (options.tag) {
      entries = entries.filter((entry) => entry.tags.includes(options.tag));
    }
    if (options.minSalience) {
      const threshold = Number(options.minSalience);
      entries = entries.filter((entry) => entry.salience >= threshold);
    }
    if (options.json) {
      console.log(JSON.stringify(entries, null, 2));
      return;
    }
    console.log(options.summary ? formatSemanticMemorySummary(entries) : formatSemanticMemoryFiltered(entries));
  });

program
  .command('remember')
  .description('Promote the top dream candidate into semantic memory')
  .action(async () => {
    const plan = await buildConsolidationPlan();
    const candidate = plan.find((item) => item.suggestedAction === 'promote') ?? plan[0];
    if (!candidate) {
      console.log('No consolidation candidates available.');
      return;
    }
    await rememberCandidate(candidate);
    console.log(JSON.stringify(candidate, null, 2));
  });

program
  .command('dream')
  .description('Build a first-pass memory consolidation plan from persisted sessions')
  .action(async () => {
    const plan = await buildConsolidationPlan();
    console.log(JSON.stringify(plan, null, 2));
  });

program
  .command('search')
  .description('Search persisted session memory')
  .requiredOption('--query <text>', 'text to search for')
  .action(async (options) => {
    const hits = await searchSessionMemory(options.query);
    console.log(JSON.stringify(hits, null, 2));
  });

program
  .command('memory-plan')
  .description('Print the current memory and dreaming strategy')
  .action(() => {
    console.log(JSON.stringify(getMemoryStrategy(), null, 2));
  });

program
  .command('recall-profile')
  .description('Print the active recall scoring profile from persisted config')
  .action(async () => {
    const config = await loadConfigFromDisk();
    console.log(JSON.stringify(config.recallScoring, null, 2));
  });

program
  .command('recall-explain')
  .description('Explain the active recall scoring profile in human-readable terms')
  .action(async () => {
    const config = await loadConfigFromDisk();
    console.log(formatRecallScoringExplanation(config.recallScoring));
  });


program
  .command('system-summary')
  .description('Show a unified operator view of runtime posture and configuration')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const config = await loadAppConfig();
    const summary = buildSystemSummary(config);
    console.log(options.json ? JSON.stringify(summary, null, 2) : formatSystemSummary(summary));
  });

program
  .command('config-show')
  .description('Print the active persisted app config')
  .action(async () => {
    const config = await loadConfigFromDisk();
    console.log(JSON.stringify(config, null, 2));
  });

program
  .command('chat')
  .description('Start or resume a simple interactive chat session')
  .option('--title <title>', 'title for a new session')
  .option('--session-id <id>', 'resume an existing session')
  .action(async (options) => {
    await runChatSession({ title: options.title, sessionId: options.sessionId });
  });

program
  .command('session-create')
  .description('Create a persistent session')
  .requiredOption('--title <title>', 'session title')
  .action(async (options) => {
    const session = await createSession(options.title);
    console.log(JSON.stringify(session, null, 2));
  });


program
  .command('session-stats')
  .description('Show aggregate session statistics')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const stats = await getSessionStats();
    console.log(options.json ? JSON.stringify(stats, null, 2) : formatSessionStats(stats));
  });

program
  .command('session-list')
  .description('List persistent sessions')
  .option('--json', 'output raw JSON')
  .option('--title-contains <text>', 'filter sessions by title substring')
  .action(async (options) => {
    let sessions = await listSessions();
    if (options.titleContains) {
      const q = String(options.titleContains).toLowerCase();
      sessions = sessions.filter((session) => session.title.toLowerCase().includes(q));
    }
    console.log(options.json ? JSON.stringify(sessions, null, 2) : formatSessionSummary(sessions));
  });

program
  .command('session-show')
  .description('Show a persistent session')
  .requiredOption('--id <id>', 'session id')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const session = await loadSession(options.id);
    if (!session) {
      console.error(`Session not found: ${options.id}`);
      process.exitCode = 1;
      return;
    }
    console.log(options.json ? JSON.stringify(session, null, 2) : formatSessionDetail(session));
  });

program
  .command('session-append')
  .description('Append a message to a persistent session')
  .requiredOption('--id <id>', 'session id')
  .requiredOption('--role <role>', 'message role: system|user|assistant')
  .requiredOption('--text <text>', 'message content')
  .action(async (options) => {
    const session = await appendMessage(options.id, options.role, options.text);
    console.log(JSON.stringify(session, null, 2));
  });



program
  .command('messaging-summary')
  .description('Show configured messaging integration summary')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const config = await loadAppConfig();
    console.log(options.json ? JSON.stringify(config.messaging, null, 2) : formatMessagingSummary(config.messaging));
  });

program
  .command('whatsapp-config')
  .description('Inspect or update WhatsApp integration settings')
  .option('--enabled <value>', 'true|false')
  .option('--mode <mode>', 'mock|webhook')
  .option('--webhook-url <url>', 'webhook URL for WhatsApp delivery bridge')
  .option('--default-recipient <id>', 'default WhatsApp recipient or chat id')
  .action(async (options) => {
    if (!options.enabled && !options.mode && !options.webhookUrl && !options.defaultRecipient) {
      const config = await loadAppConfig();
      console.log(JSON.stringify(config.messaging.whatsapp, null, 2));
      return;
    }

    const next = await configureWhatsApp({
      ...(options.enabled ? { enabled: options.enabled === 'true' } : {}),
      ...(options.mode ? { mode: options.mode } : {}),
      ...(options.webhookUrl ? { webhookUrl: options.webhookUrl } : {}),
      ...(options.defaultRecipient ? { defaultRecipient: options.defaultRecipient } : {}),
    });
    console.log(JSON.stringify(next, null, 2));
  });

program
  .command('channels')
  .description('List available message channel plugins')
  .action(async () => {
    const config = await loadAppConfig();
    const registry = createDefaultChannelRegistry(config.messaging);
    console.log(JSON.stringify(registry.list(), null, 2));
  });



program
  .command('ralph-loop')
  .description('Repeat a command until a user-provided success condition is met')
  .option('--preset <name>', 'validate|build')
  .option('--command <cmd>', 'shell command to execute')
  .option('--until <condition>', 'exit-0|stdout-includes')
  .option('--match-text <text>', 'required when using stdout-includes')
  .option('--max-iterations <n>', 'maximum loop iterations', '5')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const preset = resolveRalphPreset(options.preset);
    const command = options.command || preset.command;
    const until = options.until || preset.until;
    const matchText = options.matchText || preset.matchText;
    if (!command || !until) {
      throw new Error('Provide either a preset or both --command and --until');
    }
    const result = await runRalphLoop({
      command,
      until,
      matchText,
      maxIterations: Number(options.maxIterations),
    });
    console.log(options.json ? JSON.stringify(result, null, 2) : formatRalphLoopResult(result));
    if (!result.ok) process.exitCode = 1;
  });

program
  .command('message-run')
  .description('Run a governed messaging send flow with approval semantics')
  .requiredOption('--channel <id>', 'channel plugin id')
  .option('--to <target>', 'destination')
  .requiredOption('--text <message>', 'message text')
  .option('--approve', 'approve the governed send')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const config = await loadAppConfig();
    const result = await runGovernedMessageSend(config, {
      channel: options.channel,
      to: options.to,
      text: options.text,
      approved: Boolean(options.approve),
    });
    console.log(options.json ? JSON.stringify(result, null, 2) : formatSendResult(result));
  });

program
  .command('send')
  .description('Send a message through a configured channel plugin')
  .requiredOption('--channel <id>', 'channel plugin id')
  .option('--to <target>', 'destination')
  .requiredOption('--text <message>', 'message text')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const config = await loadAppConfig();
    let destination = options.to;
    if (options.channel === 'whatsapp') {
      assertWhatsAppSendAllowed(config);
      assertToolAccess(config, 'human-approval', 'read');
      destination = destination || config.messaging.whatsapp.defaultRecipient;
      if (!destination) {
        throw new Error('No destination provided and no WhatsApp default recipient configured');
      }
    }
    const registry = createDefaultChannelRegistry(config.messaging);
    const plugin = registry.get(options.channel);
    if (!plugin) {
      console.error(`Unknown channel: ${options.channel}`);
      process.exitCode = 1;
      return;
    }
    const result = await plugin.send({ to: destination, text: options.text });
    console.log(options.json ? JSON.stringify(result, null, 2) : formatSendResult(result));
  });




program
  .command('tool-policy-summary')
  .description('Show aggregate summary of current tool access posture')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const config = await loadAppConfig();
    const summaryText = formatToolPolicySummary(config.tools);
    if (options.json) {
      console.log(JSON.stringify({ tools: config.tools }, null, 2));
      return;
    }
    console.log(summaryText);
  });

program
  .command('tool-policy')
  .description('Show current configured tool policies')
  .option('--json', 'output raw JSON')
  .option('--access <level>', 'filter by access level')
  .option('--overridden', 'show only policies with approved overrides')
  .action(async (options) => {
    const config = await loadAppConfig();
    let tools = config.tools;
    if (options.access) {
      tools = tools.filter((tool) => tool.access === options.access);
    }
    if (options.overridden) {
      tools = tools.filter((tool) => tool.approvedOverride);
    }
    console.log(options.json ? JSON.stringify(tools, null, 2) : formatToolPolicies(tools));
  });



program
  .command('yolo-config')
  .description('Inspect or update yolo mode configuration')
  .option('--enabled <value>', 'true|false')
  .option('--warn <value>', 'true|false')
  .action(async (options) => {
    if (!options.enabled && !options.warn) {
      const config = await loadAppConfig();
      console.log(JSON.stringify(config.yolo, null, 2));
      return;
    }
    const next = await configureYolo({
      ...(options.enabled ? { enabled: options.enabled === 'true' } : {}),
      ...(options.warn ? { warn: options.warn === 'true' } : {}),
    });
    if (next.enabled) {
      console.warn('[YOLO WARNING] Yolo mode is enabled. RocketClaw2 will auto-approve guarded actions that normally require confirmation.');
    }
    console.log(JSON.stringify(next, null, 2));
  });

program
  .command('tool-run')
  .description('Run a governed tool execution simulation')
  .requiredOption('--tool <id>', 'tool id')
  .requiredOption('--action <action>', 'read|write')
  .option('--approve', 'approve a guarded write execution')
  .action(async (options) => {
    const config = await loadAppConfig();
    const result = runToolWithPolicy(config, {
      toolId: options.tool,
      action: options.action,
      approved: Boolean(options.approve),
    });
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command('tool-set')
  .description('Set a tool access level with explicit override acknowledgement for risky changes')
  .requiredOption('--tool <id>', 'tool id')
  .requiredOption('--access <level>', 'disabled|read-only|guarded-write|full-access')
  .option('--reason <text>', 'why this override is needed')
  .option('--ack-risk', 'acknowledge the risk and recommendation output')
  .action(async (options) => {
    const access = ToolAccessLevelSchema.parse(options.access);
    console.log(describeOverrideWarning(options.tool, access));
    if ((access === 'guarded-write' || access === 'full-access') && !options.ackRisk) {
      console.error('Refusing risky override without --ack-risk');
      process.exitCode = 1;
      return;
    }
    const config = await setToolPolicy(options.tool, {
      access,
      approvedOverride: Boolean(options.ackRisk),
      overrideReason: options.reason,
    });
    console.log(JSON.stringify(config.tools, null, 2));
  });

program
  .command('tools')
  .description('List core tools and current safe default recommendations')
  .action(() => {
    console.log(JSON.stringify(CORE_TOOL_CATALOG, null, 2));
  });

program
  .command('tool-risk')
  .description('Describe tool access recommendations, risks, and override posture')
  .action(() => {
    console.log(JSON.stringify(describeToolRiskPosture(), null, 2));
  });

program
  .command('roadmap')
  .description('Print smart CLI and TUI roadmap items')
  .action(() => {
    console.log(JSON.stringify(getCliTuiRoadmap(), null, 2));
  });

program
  .command('doctor')
  .description('Print basic runtime diagnostics')
  .action(async () => {
    const summary = await getRuntimeSummary();
    console.log(JSON.stringify(summary, null, 2));
  });

program
  .command('run')
  .description('Run the minimal runtime shell')
  .option('--profile <name>', 'config profile', 'default')
  .action((options) => {
    const config = loadConfig({ profile: options.profile });
    console.log(`RocketClaw2 runtime starting with profile: ${config.profile}`);
  });

program.parse();
