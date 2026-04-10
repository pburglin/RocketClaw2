#!/usr/bin/env node
import { Command } from 'commander';
import { getRuntimeSummary } from './core/runtime.js';
import { formatDoctorReport, runDoctorChecks } from './core/doctor.js';
import { buildRecallScoringDiff, getDefaultRecallScoringConfig, getRecallScoringRanges, listRecallScoringPaths, loadConfig, loadConfigFromDisk, resetRecallScoring, setRecallScoringValue } from './config/load-config.js';
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
import { listWhatsAppInbound, startWhatsAppWebhookListener } from './messaging/whatsapp-listener.js';
import { formatMessagingSummary } from './messaging/formatters.js';
import { assertWhatsAppSendAllowed } from './messaging/enforcement.js';
import { formatSendResult } from './messaging/send-formatters.js';
import { runGovernedMessageSend } from './messaging/runtime.js';
import { createApprovalRequest, loadApprovals, resolveApprovalRequest } from './approval/store.js';
import { formatApprovals, formatApprovalSummary, formatPendingApprovalActions } from './approval/formatters.js';
import { approveAndDescribeNextStep } from './approval/runtime.js';
import { resolveRalphPreset, runRalphLoop } from './loops/ralph.js';
import { formatRalphLoopResult } from './loops/ralph-formatters.js';
import { configureYolo } from './config/yolo-config.js';
import { buildSystemSummary, formatSystemSummary } from './config/system-summary.js';
import { applySessionOverrides } from './config/session-overrides.js';
import { runSetupWizard } from './setup/wizard.js';
import { formatRecommendedNextActions, getRecommendedNextActions } from './core/next-actions.js';
import { buildWorkspaceStatus, formatWorkspaceStatus } from './core/workspace-status.js';
import { buildHarnessPlan, harnessResume, replayHarnessValidation, runCodingHarness, runCodingHarnessFromPlan } from './harness/coding-harness.js';
import { formatCodingHarnessResult, formatHarnessChain, formatHarnessGuidanceView, formatHarnessIterations, formatHarnessLineageView, formatHarnessPlan, formatHarnessPlanView, formatHarnessValidationView, formatValidationResult } from './harness/formatters.js';
import { approveHarnessPlan, buildHarnessChain, loadHarnessRun, loadHarnessRunnableInput, loadHarnessRuns, saveHarnessRun } from './harness/store.js';
import { loadIterationEntries } from './harness/iteration-store.js';
import { formatHarnessRunSummary, formatHarnessRuns } from './harness/list-formatters.js';
import { runLlmQuery } from './llm/client.js';
import { runLlmTest } from './llm/test.js';
import { runTaskLoop } from './loops/task-loop.js';
import { formatTaskLoopResult } from './loops/task-loop-formatters.js';
import { buildLlmStatus, formatLlmStatus } from './llm/status.js';
import { deleteImportedSkill, importSkill, updateAllImportedSkills, updateImportedSkill } from './skills/runtime.js';
import { formatImportedSkills, formatSkillSummary } from './skills/formatters.js';
import { loadImportedSkills } from './skills/store.js';
import { getCliTuiRoadmap } from './tui/roadmap.js';
import { formatRecallScoringExplanation, formatSemanticMemory, formatSessionDetail, formatSessionStats, formatSessionSummary } from './tui/formatters.js';
import { appendMessage, createSession, listSessions, loadSession } from './sessions/store.js';
import { getSessionStats } from './sessions/stats.js';
import { runChatSession } from './commands/chat.js';

const program = new Command();

program
  .option('--llm-base-url <url>', 'override LLM base URL for this CLI session only')
  .option('--llm-api-key <key>', 'override LLM API key for this CLI session only')
  .option('--llm-model <model>', 'override LLM model for this CLI session only');

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
  .command('recall-paths')
  .description('List valid persisted recall scoring dot paths')
  .action(() => {
    console.log(JSON.stringify({ validPaths: listRecallScoringPaths() }, null, 2));
  });

program
  .command('recall-diff')
  .description('Show delta between current recall scoring values and defaults')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const diff = await buildRecallScoringDiff();
    if (options.json) {
      console.log(JSON.stringify(diff, null, 2));
      return;
    }
    const hasNonZero = Object.values(diff).some((f) => f.delta !== 0);
    if (!hasNonZero) {
      console.log('All recall scoring fields are at their default values. No deltas.');
      return;
    }
    for (const [path, field] of Object.entries(diff)) {
      if (field.delta === 0) continue;
      const sign = field.delta > 0 ? '+' : '';
      console.log(`${path}: current=${field.current} default=${field.default} delta=${sign}${field.delta}`);
    }
  });

program
  .command('recall-reset')
  .description('Reset one or more recall scoring fields to defaults (omit --path to reset all)')
  .option('--path <path>', 'dot path to reset (e.g. sessionSalienceMultiplier), omit to reset everything')
  .action(async (options) => {
    const paths = options.path ? [options.path] : undefined;
    const next = await resetRecallScoring(paths);
    console.log(JSON.stringify(next.recallScoring, null, 2));
  });

program
  .command('recall-set')
  .description('Set a persisted recall scoring value by dot path')
  .requiredOption('--path <path>', 'e.g. sessionSalienceMultiplier or sessionRecency.older')
  .requiredOption('--value <number>', 'numeric value')
  .action(async (options) => {
    try {
      const next = await setRecallScoringValue(options.path, Number(options.value));
      console.log(JSON.stringify(next.recallScoring, null, 2));
    } catch (error) {
      if (error instanceof Error) {
        const ranges = getRecallScoringRanges();
        const rule = ranges[options.path];
        if (rule && error.message.includes('Allowed range:')) {
          console.error(`Error: ${error.message}. Suggested range: ${rule.min} to ${rule.max}`);
        } else {
          console.error(`Error: ${error.message}`);
        }
      }
      process.exitCode = 1;
    }
  });

program
  .command('skill-import')
  .description('Import a skill from a user-provided source URL')
  .requiredOption('--url <url>', 'source URL, typically a git repository')
  .action(async (options) => {
    const skill = await importSkill(options.url);
    console.log(JSON.stringify(skill, null, 2));
  });


program
  .command('skill-summary')
  .description('Show an aggregate summary of imported skills')
  .action(async () => {
    const skills = await loadImportedSkills();
    console.log(formatSkillSummary(skills));
  });

program
  .command('skill-list')
  .description('List imported skills')
  .option('--json', 'output raw JSON')
  .option('--source-contains <text>', 'filter skills by source URL substring')
  .option('--summary', 'show aggregate summary')
  .action(async (options) => {
    let skills = await loadImportedSkills();
    if (options.sourceContains) {
      const q = String(options.sourceContains).toLowerCase();
      skills = skills.filter((skill) => skill.sourceUrl.toLowerCase().includes(q));
    }
    if (options.json) {
      console.log(JSON.stringify(skills, null, 2));
      return;
    }
    console.log(options.summary ? formatSkillSummary(skills) : formatImportedSkills(skills));
  });

program
  .command('skill-remove')
  .description('Remove an imported skill')
  .requiredOption('--id <id>', 'imported skill id')
  .action(async (options) => {
    const removed = await deleteImportedSkill(options.id);
    console.log(JSON.stringify({ removed, id: options.id }, null, 2));
  });

program
  .command('skill-update')
  .description('Update one imported skill or all imported skills')
  .option('--id <id>', 'skill id, omit to update all')
  .action(async (options) => {
    if (options.id) {
      const updated = await updateImportedSkill(options.id);
      console.log(JSON.stringify(updated, null, 2));
      return;
    }
    const updated = await updateAllImportedSkills();
    console.log(JSON.stringify(updated, null, 2));
  });

program
  .command('workspace-status')
  .description('Show a compact dashboard-like view of current runtime state')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const status = await buildWorkspaceStatus();
    console.log(options.json ? JSON.stringify(status, null, 2) : formatWorkspaceStatus(status));
  });

program
  .command('next-actions')
  .description('Show recommended next operator actions based on current runtime posture')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const actions = await getRecommendedNextActions();
    console.log(options.json ? JSON.stringify(actions, null, 2) : formatRecommendedNextActions(actions));
  });

program
  .command('setup-wizard')
  .description('Show guided setup and next-step recommendations')
  .option('--interactive', 'ask setup questions and persist answers')
  .action(async (options) => {
    const text = await runSetupWizard(Boolean(options.interactive));
    console.log(text);
  });

program
  .command('system-summary')
  .description('Show a unified operator view of runtime posture and configuration')
  .option('--json', 'output raw JSON')
  .action(async (options, command) => {
    if (options.requireApprovedPlan) {
      throw new Error('Direct harness-run is disabled in require-approved-plan mode. Use harness-plan, harness-approve, then harness-run-plan.');
    }
    const rootConfig = await loadAppConfig();
    const globalOpts = command.parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
    });
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
  .action(async (options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = command.parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
    });
    await runChatSession({ title: options.title, sessionId: options.sessionId, config });
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
  .command('whatsapp-listen')
  .description('Start a local WhatsApp webhook listener for inbound events')
  .option('--port <n>', 'listener port', '8787')
  .action(async (options) => {
    const port = Number(options.port);
    await startWhatsAppWebhookListener({ port });
    console.log(`WhatsApp webhook listener running on http://127.0.0.1:${port}/whatsapp/webhook`);
  });

program
  .command('whatsapp-inbox')
  .description('Show persisted inbound WhatsApp webhook events')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const items = await listWhatsAppInbound();
    const text = items.map((item) => `${item.receivedAt} | ${item.from} | ${item.text}`).join('\n');
    console.log(options.json ? JSON.stringify(items, null, 2) : text || 'No inbound WhatsApp events.');
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
  .command('harness-list')
  .description('List persisted autonomous harness runs')
  .option('--kind <kind>', 'plan|run')
  .option('--approval <status>', 'draft|approved|n/a')
  .option('--ok <value>', 'true|false')
  .option('--summary', 'show aggregate artifact summary')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    let runs = await loadHarnessRuns();
    if (options.kind) {
      runs = runs.filter((item) => (options.kind === 'run' ? (item.kind ?? 'run') === 'run' : item.kind === options.kind));
    }
    if (options.approval) {
      runs = runs.filter((item) => String(item.approvalStatus ?? 'n/a') === options.approval);
    }
    if (options.ok !== undefined) {
      const wanted = options.ok === 'true';
      runs = runs.filter((item) => Boolean(item.ok) === wanted);
    }
    if (options.json) {
      console.log(JSON.stringify(runs, null, 2));
      return;
    }
    console.log(options.summary ? formatHarnessRunSummary(runs) : formatHarnessRuns(runs));
  });

program
  .command('harness-show')
  .description('Show a persisted autonomous harness run artifact')
  .requiredOption('--id <id>', 'harness run id')
  .option('--plan', 'show only plan-specific view')
  .option('--guidance', 'show only latest guidance text')
  .option('--validation', 'show only latest validation fields')
  .option('--lineage', 'show artifact lineage and related references')
  .option('--full', 'show full artifact including guidance')
  .action(async (options) => {
    const run = await loadHarnessRun(options.id);
    if (!run) {
      throw new Error(`Harness run not found: ${options.id}`);
    }
    if (options.plan) {
      console.log(formatHarnessPlanView(run));
      return;
    }
    if (options.guidance) {
      console.log(formatHarnessGuidanceView(run));
      return;
    }
    if (options.validation) {
      console.log(formatHarnessValidationView(run));
      return;
    }
    if (options.lineage) {
      console.log(formatHarnessLineageView(run));
      return;
    }
    if (options.full) {
      const iterations = await loadIterationEntries(options.id);
      console.log(JSON.stringify({ ...run, iterationsDetail: iterations }, null, 2));
    } else {
      const { lastGuidance, planText, ...summary } = run as any;
      console.log(JSON.stringify(summary, null, 2));
    }
  });

program
  .command('harness-chain')
  .description('Show a consolidated chain view for a harness artifact, related plan, and resumes')
  .requiredOption('--id <id>', 'harness artifact id')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const chain = await buildHarnessChain(options.id);
    console.log(options.json ? JSON.stringify(chain, null, 2) : formatHarnessChain(chain));
  });

program
  .command('harness-iterations')
  .description('Show the per-iteration history for a harness run')
  .requiredOption('--id <id>', 'harness run id')
  .option('--latest', 'show only the latest iteration')
  .option('--failed-only', 'show only failed iterations')
  .option('--iteration <n>', 'show only a specific iteration number')
  .option('--guidance', 'include guidance text for each returned iteration')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    let entries = await loadIterationEntries(options.id);
    if (options.iteration) {
      const wanted = Number(options.iteration);
      entries = entries.filter((entry) => entry.iteration === wanted);
    }
    if (options.failedOnly) {
      entries = entries.filter((entry) => entry.validationPassed === false);
    }
    if (options.latest && entries.length > 0) {
      entries = [entries[entries.length - 1]!];
    }
    console.log(options.json ? JSON.stringify(entries, null, 2) : formatHarnessIterations(entries, { includeGuidance: Boolean(options.guidance) }));
  });

program
  .command('harness-validate')
  .description('Re-apply code blocks from a harness run artifact and re-run its validation command')
  .requiredOption('--id <id>', 'harness run id')
  .option('--full', 'show full artifact including guidance')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const result = await replayHarnessValidation(options.id);
    console.log(options.json ? JSON.stringify(result, null, 2) : formatValidationResult(result));
    if (!result.passed) process.exitCode = 1;
  });

program
  .command('harness-plan')
  .description('Generate a reviewable implementation plan for a harness task without writing files')
  .requiredOption('--workspace <path>', 'target workspace path')
  .requiredOption('--task <text>', 'task description')
  .requiredOption('--validate <cmd>', 'validation command that would be used during execution')
  .option('--request-approval', 'also create a persistent approval request for this plan')
  .option('--json', 'output raw JSON')
  .action(async (options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = command.parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
    });
    const result = await buildHarnessPlan(config, {
      workspace: options.workspace,
      task: options.task,
      validateCommand: options.validate,
    });
    const artifact = await saveHarnessRun(result);
    const approval = options.requestApproval
      ? await createApprovalRequest({
          kind: 'harness-plan',
          target: artifact.runId,
          detail: `Review harness plan for task: ${options.task}`,
        })
      : null;
    if (approval) {
      await saveHarnessRun({ ...result, runId: artifact.runId, approvalRequestId: approval.id }, undefined, artifact.runId);
    }
    const enriched = { ...result, runId: artifact.runId, artifactPath: artifact.path, approvalRequestId: approval?.id };
    console.log(options.json ? JSON.stringify(enriched, null, 2) : formatHarnessPlan(enriched));
  });

program
  .command('harness-approve')
  .description('Approve a saved harness plan artifact for execution')
  .requiredOption('--id <run-id>', 'saved plan id to approve')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const result = await approveHarnessPlan(options.id);
    console.log(options.json ? JSON.stringify(result, null, 2) : `Approved harness plan: ${options.id}`);
  });


program
  .command('harness-run-plan')
  .description('Execute an approved harness plan artifact as the basis for an autonomous coding run')
  .requiredOption('--id <id>', 'approved harness plan id')
  .option('--json', 'output raw JSON')
  .action(async (options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = command.parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
    });
    const result = await runCodingHarnessFromPlan(config, options.id);
    console.log(options.json ? JSON.stringify(result, null, 2) : formatCodingHarnessResult(result));
    if (!result.ok) process.exitCode = 1;
  });

program
  .command('harness-run')
  .description('Run an autonomous coding harness loop for a workspace task until validation passes or iterations are exhausted')
  .option('--workspace <path>', 'target workspace path')
  .option('--task <text>', 'task description')
  .option('--validate <cmd>', 'validation command to run in the workspace')
  .option('--max-iterations <n>', 'maximum iterations', '5')
  .option('--require-approved-plan', 'refuse direct execution; require harness-plan, harness-approve, then harness-run-plan')
  .option('--json', 'output raw JSON')
  .action(async (options, command) => {
    if (options.requireApprovedPlan) {
      throw new Error('Direct harness-run is disabled in require-approved-plan mode. Use harness-plan, harness-approve, then harness-run-plan.');
    }
    const rootConfig = await loadAppConfig();
    const globalOpts = command.parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
    });
    const resolved = options.id
      ? await loadHarnessRunnableInput(options.id)
      : null;
    if (options.id && !resolved) {
      throw new Error(`Runnable harness artifact not found or incomplete: ${options.id}`);
    }
    if (options.id && options.requireApprovedPlan && resolved?.approvalStatus !== 'approved') {
      throw new Error(`Harness plan ${options.id} is not approved. Run harness-approve --id ${options.id} first.`);
    }
    const workspace = resolved?.workspace ?? options.workspace;
    const task = resolved?.task ?? options.task;
    const validateCommand = resolved?.validateCommand ?? options.validate;
    if (!workspace || !task || !validateCommand) {
      throw new Error('harness-run requires either --id <plan-id> or all of --workspace, --task, and --validate');
    }
    const result = await runCodingHarness(config, {
      workspace,
      task,
      validateCommand,
      maxIterations: Number(options.maxIterations),
    });
    const artifact = await saveHarnessRun(result);
    const enriched = { ...result, runId: artifact.runId, artifactPath: artifact.path };
    console.log(options.json ? JSON.stringify(enriched, null, 2) : formatCodingHarnessResult(enriched));
    if (!result.ok) process.exitCode = 1;
  });

program
  .command('harness-resume')
  .description('Resume a failed harness run with a fresh LLM iteration from the last saved state')
  .requiredOption('--id <run-id>', 'harness run id to resume')
  .option('--json', 'output raw JSON')
  .action(async (options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = command.parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
    });
    const result = await harnessResume(config, options.id);
    const artifact = await saveHarnessRun(result);
    const enriched = { ...result, runId: artifact.runId, artifactPath: artifact.path };
    console.log(options.json ? JSON.stringify(enriched, null, 2) : formatCodingHarnessResult(enriched));
    if (!result.ok) process.exitCode = 1;
  });

program
  .command('task-loop')
  .description('Run an LLM-guided iterative task loop until validation passes or max iterations is reached')
  .requiredOption('--task <text>', 'task description')
  .requiredOption('--validate <cmd>', 'validation command to run each iteration')
  .option('--max-iterations <n>', 'maximum loop iterations', '5')
  .option('--json', 'output raw JSON')
  .action(async (options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = command.parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
    });
    const result = await runTaskLoop(config, {
      task: options.task,
      validateCommand: options.validate,
      maxIterations: Number(options.maxIterations),
    });
    console.log(options.json ? JSON.stringify(result, null, 2) : formatTaskLoopResult(result));
    if (!result.ok) process.exitCode = 1;
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
  .command('approval-create')
  .description('Create a persistent approval request')
  .requiredOption('--kind <kind>', 'tool-write|message-send|harness-plan')
  .requiredOption('--target <target>', 'target tool or channel')
  .requiredOption('--detail <detail>', 'approval detail')
  .action(async (options) => {
    const item = await createApprovalRequest({ kind: options.kind, target: options.target, detail: options.detail });
    console.log(JSON.stringify(item, null, 2));
  });


program
  .command('approval-pending')
  .description('Show only actionable pending approvals with next-step hints')
  .action(async () => {
    const items = await loadApprovals();
    console.log(formatPendingApprovalActions(items));
  });

program
  .command('approval-list')
  .description('List approval requests')
  .option('--status <status>', 'pending|approved|rejected')
  .option('--kind <kind>', 'tool-write|message-send|harness-plan')
  .option('--json', 'output raw JSON')
  .option('--summary', 'show aggregate summary')
  .action(async (options) => {
    let items = await loadApprovals();
    if (options.status) items = items.filter((item) => item.status === options.status);
    if (options.kind) items = items.filter((item) => item.kind === options.kind);
    if (options.json) {
      console.log(JSON.stringify(items, null, 2));
      return;
    }
    console.log(options.summary ? formatApprovalSummary(items) : formatApprovals(items));
  });


program
  .command('approval-approve-run')
  .description('Approve a request and print the recommended next execution step')
  .requiredOption('--id <id>', 'approval request id')
  .action(async (options) => {
    const result = await approveAndDescribeNextStep(options.id);
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command('approval-resolve')
  .description('Resolve an approval request')
  .requiredOption('--id <id>', 'approval request id')
  .requiredOption('--status <status>', 'approved|rejected')
  .action(async (options) => {
    const item = await resolveApprovalRequest(options.id, options.status);
    console.log(JSON.stringify(item, null, 2));
  });

program
  .command('tool-run')
  .description('Run a governed tool execution simulation')
  .requiredOption('--tool <id>', 'tool id')
  .requiredOption('--action <action>', 'read|write')
  .option('--approve', 'approve a guarded write execution')
  .action(async (options) => {
    const config = await loadAppConfig();
    const result = await runToolWithPolicy(config, {
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
  .command('llm-status')
  .description('Show current LLM configuration and readiness state')
  .option('--json', 'output raw JSON')
  .action(async (options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = command.parent?.opts?.() ?? {};
    const hasOverrides = Boolean(globalOpts.llmBaseUrl || globalOpts.llmApiKey || globalOpts.llmModel);
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
    });
    const status = buildLlmStatus(config, hasOverrides);
    console.log(options.json ? JSON.stringify(status, null, 2) : formatLlmStatus(status));
  });

program
  .command('llm-test')
  .description('Run a quick connectivity and auth test against the configured LLM')
  .action(async (_options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = command.parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
    });
    try {
      const result = await runLlmTest(config);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command('llm-query')
  .description('Run a real query against the configured or session-overridden LLM')
  .requiredOption('--prompt <text>', 'prompt to send to the model')
  .action(async (options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = command.parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
    });
    try {
      const response = await runLlmQuery(config, options.prompt);
      console.log(response);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
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
