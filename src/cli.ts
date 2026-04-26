#!/usr/bin/env node
import { Command } from 'commander';
import { computeSummary, getLlmPerformanceStats } from './telemetry/store.js';
import { formatTelemetrySummary, formatPerfReport, formatDeprecationReport, formatLlmPerformanceStats } from './telemetry/formatters.js';
import { getQueueStats, clearDoneItems } from './queue/store.js';
import { processQueue as runQueue } from './queue/runtime.js';
import { QueueOrchestrator } from './queue/orchestrator.js';
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
import { configureWhatsApp, syncWhatsAppOwnPhoneNumber } from './messaging/whatsapp-config.js';
import { clearWhatsAppSession, loadWhatsAppSession, saveWhatsAppSession } from './messaging/whatsapp-session.js';
import { listWhatsAppNativeOutbox } from './messaging/whatsapp-native.js';
import { authorizeWhatsAppQrToken, createWhatsAppQrSession } from './messaging/whatsapp-qr.js';
import { listWhatsAppInbound, startWhatsAppWebhookListener } from './messaging/whatsapp-listener.js';
import { formatMessagingSummary } from './messaging/formatters.js';
import { formatWhatsAppSessionProfile } from './messaging/session-formatters.js';
import { assertWhatsAppSendAllowed } from './messaging/enforcement.js';
import { formatSendResult } from './messaging/send-formatters.js';
import { runGovernedMessageSend } from './messaging/runtime.js';
import { createApprovalRequest, loadApprovals, resolveApprovalRequest, bulkResolveApprovals, purgeStaleApprovals } from './approval/store.js';
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
import { buildWorldModel, formatWorldModel } from './core/world-model.js';
import { formatHandoffArtifact, formatHandoffList } from './handoff/formatters.js';
import { resolveHandoffPreset } from './handoff/presets.js';
import { createHandoffArtifact } from './handoff/runtime.js';
import { loadHandoffArtifact, listHandoffArtifacts } from './handoff/store.js';
import { buildHarnessPlan, harnessResume, replayHarnessValidation, runCodingHarness, runCodingHarnessFromPlan } from './harness/coding-harness.js';
import { formatCodingHarnessResult, formatHarnessChain, formatHarnessChainSummary, formatHarnessGuidanceView, formatHarnessIterations, formatHarnessLineageView, formatHarnessPlan, formatHarnessPlanView, formatHarnessValidationView, formatValidationResult } from './harness/formatters.js';
import { approveHarnessPlan, buildHarnessChain, loadHarnessRun, loadHarnessRunnableInput, loadHarnessRuns, saveHarnessRun } from './harness/store.js';
import { filterIterationEntries, loadIterationEntries } from './harness/iteration-store.js';
import { formatHarnessRunSummary, formatHarnessRuns } from './harness/list-formatters.js';
import { runLlmQuery, type LlmTraceEvent } from './llm/client.js';
import { runLlmTest } from './llm/test.js';
import { runTaskLoop } from './loops/task-loop.js';
import { formatTaskLoopResult } from './loops/task-loop-formatters.js';
import { buildLlmStatus, formatLlmStatus } from './llm/status.js';
import {
  buildBottomFooterClear,
  buildBottomFooterRender,
  buildFloatingFooterClear,
  buildFloatingFooterRender,
  buildFooterReserveEnd,
  buildFooterReserveStart,
} from './cli-output.js';
import { deleteImportedSkill, importSkill, updateAllImportedSkills, updateImportedSkill } from './skills/runtime.js';
import { formatImportedSkills, formatSkillSummary } from './skills/formatters.js';
import { loadImportedSkills } from './skills/store.js';
import { getCliTuiRoadmap } from './tui/roadmap.js';
import { formatRecallScoringExplanation, formatSemanticMemory, formatSessionDetail, formatSessionOverview, formatSessionStats, formatSessionSummary } from './tui/formatters.js';
import { createRocketClawTUI } from './tui/index.js';
import { buildRoleTemplate, buildRoleTemplateFromHandoff, formatRoleTemplate, normalizeTeamRole } from './teams/role-templates.js';
import { appendMessage, createSession, listSessions, loadSession } from './sessions/store.js';
import { getSessionStats } from './sessions/stats.js';
import { runChatSession } from './commands/chat.js';
import { runAutoCode } from './commands/auto-code.js';

function normalizeCliArgv(argv: string[]): string[] {
  const prefix = argv.slice(0, 2);
  const rest = argv.slice(2);
  const normalized: string[] = [];

  for (let i = 0; i < rest.length; i += 1) {
    const raw = rest[i] ?? '';
    const token = raw.replace(/[\u2013\u2014\u2212]/g, '-');
    const nextRaw = rest[i + 1] ?? '';
    const next = nextRaw.replace(/[\u2013\u2014\u2212]/g, '-');

    if (token === '-' && /^-[A-Za-z][A-Za-z0-9-]*$/.test(next)) {
      normalized.push(`-${next}`);
      i += 1;
      continue;
    }

    if (/^-[A-Za-z][A-Za-z0-9-]+$/.test(token) && !token.startsWith('--')) {
      normalized.push(`-${token}`);
      continue;
    }

    normalized.push(token);
  }

  return [...prefix, ...normalized];
}

function formatJsonBlock(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

type CliRenderOptions = {
  timestamps?: boolean;
};

type CliMessageKind = 'info' | 'success' | 'error' | 'warn';

function supportsColor(stream: NodeJS.WriteStream): boolean {
  return Boolean(stream.isTTY) && !process.env.NO_COLOR && (process.env.TERM ?? '').toLowerCase() !== 'dumb';
}

function formatTimestampPrefix(enabled: boolean): string {
  if (!enabled) return '';
  return `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] `;
}

function extractReadableText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';

  if (Array.isArray(value)) {
    return value.map((part) => extractReadableText(part)).filter(Boolean).join('\n').trim();
  }

  const record = value as Record<string, unknown>;
  if (typeof record.text === 'string') return record.text;
  if (typeof record.content === 'string') return record.content;
  if (record.content) return extractReadableText(record.content);
  if (record.message) return extractReadableText(record.message);
  if (typeof record.output_text === 'string') return record.output_text;
  if (record.output) return extractReadableText(record.output);
  return '';
}

function extractReadablePrompt(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  const record = value as Record<string, unknown>;
  const messages = record.messages;
  if (!Array.isArray(messages)) return '';
  return messages
    .map((message) => {
      if (!message || typeof message !== 'object' || Array.isArray(message)) return '';
      const item = message as Record<string, unknown>;
      const role = typeof item.role === 'string' ? item.role : 'message';
      const content = extractReadableText(item.content);
      return content ? `${role}:\n${content}` : '';
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function formatCliLine(text: string, kind: CliMessageKind, options: CliRenderOptions = {}, stream: NodeJS.WriteStream = process.stderr): string {
  const marker = kind === 'success'
    ? '✔'
    : kind === 'error'
      ? '✖'
      : kind === 'warn'
        ? '▲'
        : '›';
  const timestamp = formatTimestampPrefix(Boolean(options.timestamps));
  const base = `${timestamp}${marker} ${text}`;
  if (!supportsColor(stream)) return base;

  const colorCode = kind === 'success'
    ? 82
    : kind === 'error'
      ? 196
      : kind === 'warn'
        ? 214
        : 39;
  return `\x1b[38;5;${colorCode}m${base}\x1b[0m`;
}

function parseOptionalNonNegativeInt(value: unknown, flagName: string): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${flagName} must be a non-negative integer`);
  }
  return parsed;
}

function parseEditMode(value: unknown): 'full-file' | 'diff' | 'mixed' {
  if (value === undefined || value === null || value === '') return 'mixed';
  const normalized = String(value).toLowerCase().trim();
  if (normalized === 'full-file' || normalized === 'diff' || normalized === 'mixed') {
    return normalized;
  }
  throw new Error(
    `--edit-mode must be one of: full-file, diff, mixed  (got "${value}")`,
  );
}

function createVerboseLlmRenderer(options: CliRenderOptions = {}, progressRenderer?: { temporarilyClear?: () => void; redrawWaiting?: () => void; suspend?: () => void; resume?: () => void }) {
  const verboseStream = process.stdout;
  const colorEnabled = supportsColor(verboseStream);
  const color = (code: number, text: string) => colorEnabled ? `\x1b[${code}m${text}\x1b[0m` : text;
  const header = (text: string) => color(95, text);
  const label = (text: string) => color(36, text);
  const dim = (text: string) => color(90, text);
  const block = (title: string, content: string) => `${header(title)}\n${content}\n`;
  const withSuspendedFooter = (fn: () => void) => {
    progressRenderer?.temporarilyClear?.();
    try {
      fn();
    } finally {
      progressRenderer?.redrawWaiting?.();
    }
  };
  const writeBlock = (text: string, kind: CliMessageKind = 'info') => {
    withSuspendedFooter(() => {
      verboseStream.write(`\n${formatCliLine(text, kind, options)}\n`);
    });
  };
  let activeStreamLabel: string | undefined;
  let streamOpen = false;

  const startStream = (streamLabel?: string) => {
    if (streamOpen && activeStreamLabel === streamLabel) return;
    if (streamOpen) {
      verboseStream.write('\n');
    }
    activeStreamLabel = streamLabel;
    const context = streamLabel ? ` (${streamLabel})` : '';
    progressRenderer?.suspend?.();
    writeBlock(header(`━━ LLM STREAM${context} ━━`), 'success');
    streamOpen = true;
  };

  const endStream = () => {
    if (!streamOpen) return;
    verboseStream.write('\n');
    streamOpen = false;
    activeStreamLabel = undefined;
    progressRenderer?.resume?.();
  };

  return {
    streamChunk(chunk: string, streamLabel?: string) {
      startStream(streamLabel);
      verboseStream.write(chunk);
    },
    finishStream() {
      endStream();
    },
    render(event: LlmTraceEvent) {
      if (event.phase !== 'request') {
        endStream();
      }
      const context = event.label ? ` (${event.label})` : '';
      if (event.phase === 'request') {
        const promptText = extractReadablePrompt(event.requestBody ?? {});
        const requestRecord = (event.requestBody && typeof event.requestBody === 'object' && !Array.isArray(event.requestBody))
          ? event.requestBody as Record<string, unknown>
          : {};
        const messageCount = Array.isArray(requestRecord.messages) ? requestRecord.messages.length : 0;
        const sections = [
          `${label('Endpoint:')} ${event.endpoint}`,
          `${label('Model:')} ${event.model}`,
          `${label('Channel:')} ${event.channel}`,
          `${label('Message count:')} ${String(messageCount)}`,
          `${label('Temperature:')} ${String(requestRecord.temperature ?? 'n/a')}`,
          block('Prompt text', promptText || dim('(unavailable)')),
        ];
        writeBlock(header(`━━ LLM REQUEST${context} ━━`));
        withSuspendedFooter(() => {
          verboseStream.write(`${sections.join('\n')}\n`);
        });
        return;
      }

      if (event.phase === 'response') {
        const sections = [
          `${label('HTTP status:')} ${String(event.responseStatus ?? 'n/a')}`,
          block('Raw response payload', formatJsonBlock(event.responseBody ?? {})),
          block('Extracted text', event.extractedText && event.extractedText.trim() ? event.extractedText : dim('(empty)')),
        ];
        writeBlock(header(`━━ LLM RESPONSE${context} ━━`), 'success');
        withSuspendedFooter(() => {
          verboseStream.write(`${sections.join('\n')}\n`);
        });
        return;
      }

      if (event.phase === 'retry') {
        const sections = [
          `${label('HTTP status:')} ${String(event.responseStatus ?? 'n/a')}`,
          `${label('Attempt:')} ${String(event.attempt ?? 'n/a')} of ${String((event.maxRetries ?? 0) + 1)}`,
          `${label('Retrying in:')} ${String(event.backoffMs ?? 0)} ms`,
          `${label('Reason:')} ${event.error ?? 'Retriable server-side LLM failure'}`,
        ];
        writeBlock(header(`━━ LLM RETRY${context} ━━`), 'warn');
        withSuspendedFooter(() => {
          verboseStream.write(`${sections.join('\n')}\n`);
        });
        return;
      }

      const sections = [
        `${label('HTTP status:')} ${String(event.responseStatus ?? 'n/a')}`,
        `${label('Error:')} ${event.error ?? 'Unknown error'}`,
      ];
      if (event.responseBody !== undefined) {
        sections.push(block('Raw error payload', typeof event.responseBody === 'string' ? event.responseBody : formatJsonBlock(event.responseBody)));
      }
      writeBlock(header(`━━ LLM ERROR${context} ━━`), 'error');
      withSuspendedFooter(() => {
        verboseStream.write(`${sections.join('\n')}\n`);
      });
    },
  };
}

function createStreamTextRenderer(options: CliRenderOptions = {}, progressRenderer?: { temporarilyClear?: () => void; redrawWaiting?: () => void; suspend?: () => void; resume?: () => void }) {
  let activeStreamLabel: string | undefined;
  let streamOpen = false;
  const withSuspendedFooter = (fn: () => void) => {
    progressRenderer?.temporarilyClear?.();
    try {
      fn();
    } finally {
      progressRenderer?.redrawWaiting?.();
    }
  };

  const startStream = (streamLabel?: string) => {
    if (streamOpen && activeStreamLabel === streamLabel) return;
    if (streamOpen) {
      process.stderr.write('\n');
    }
    activeStreamLabel = streamLabel;
    const context = streamLabel ? ` (${streamLabel})` : '';
    progressRenderer?.suspend?.();
    process.stderr.write(`\n${formatCliLine(`Streaming model output${context}`, 'success', options)}\n`);
    streamOpen = true;
  };

  const endStream = () => {
    if (!streamOpen) return;
    process.stderr.write('\n');
    streamOpen = false;
    activeStreamLabel = undefined;
    progressRenderer?.resume?.();
  };

  return {
    streamChunk(chunk: string, streamLabel?: string) {
      startStream(streamLabel);
      process.stdout.write(chunk);
    },
    finishStream() {
      endStream();
    },
  };
}

function createProgressRenderer(defaultPrefix: string, options: CliRenderOptions = {}) {
  let hasActiveInlineLine = false;
  let footerReserved = false;
  let suspended = false;
  let spinnerTimer: NodeJS.Timeout | undefined;
  let spinnerIndex = 0;
  let waitingLine = '';
  let preservedWaitingLine = '';
  const spinnerFrames = ['|', '/', '-', '\\'];
  const colorEnabled = supportsColor(process.stderr);
  const spinnerColors = [39, 45, 51, 87, 123, 159];
  const getTtyRows = () => {
    const candidates = [process.stderr.rows, process.stdout.rows, Number(process.env.LINES)];
    return candidates.find((value) => Number.isInteger(value) && Number(value) > 1) as number | undefined;
  };

  const resolveKind = (stage: string): CliMessageKind => {
    if (/error|failed|timeout/i.test(stage)) return 'error';
    if (/passed|complete|approved|saved|written|response/i.test(stage)) return 'success';
    if (/retry|warning/i.test(stage)) return 'warn';
    return 'info';
  };

  const renderInlineLine = (line: string) => {
    if (!process.stderr.isTTY) {
      process.stderr.write(`${line}\n`);
      hasActiveInlineLine = false;
      return;
    }

    const ttyRows = getTtyRows();
    if (ttyRows && ttyRows > 1) {
      if (!footerReserved) {
        process.stderr.write(buildFooterReserveStart(ttyRows));
        footerReserved = true;
      }
      process.stderr.write(buildBottomFooterRender(ttyRows, line));
    } else {
      process.stderr.write(buildFloatingFooterRender(line));
    }
    hasActiveInlineLine = true;
  };

  const stopSpinner = (preserveWaiting = false) => {
    if (spinnerTimer) {
      clearInterval(spinnerTimer);
      spinnerTimer = undefined;
    }
    if (!preserveWaiting) {
      waitingLine = '';
      preservedWaitingLine = '';
    }
    spinnerIndex = 0;
  };

  const formatSpinner = () => {
    const frame = spinnerFrames[spinnerIndex % spinnerFrames.length];
    if (!colorEnabled) return frame;
    const color = spinnerColors[spinnerIndex % spinnerColors.length];
    return `\x1b[38;5;${color}m${frame}\x1b[0m`;
  };

  const drawWaitingLine = () => {
    if (!waitingLine || suspended) return;
    renderInlineLine(`${formatSpinner()} ${waitingLine}`);
  };

  const startSpinner = () => {
    if (spinnerTimer || !process.stderr.isTTY) return;
    spinnerTimer = setInterval(() => {
      spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
      drawWaitingLine();
    }, 120);
  };

  const clearInlineLine = (preserveWaiting = false) => {
    if (preserveWaiting && waitingLine) {
      preservedWaitingLine = waitingLine;
    }
    stopSpinner(preserveWaiting);
    if (!hasActiveInlineLine) return;
    if (process.stderr.isTTY) {
      const ttyRows = getTtyRows();
      if (footerReserved && ttyRows && ttyRows > 1) {
        process.stderr.write(buildBottomFooterClear(ttyRows));
      } else {
        process.stderr.write(buildFloatingFooterClear());
      }
    } else {
      process.stderr.write('\n');
    }
    hasActiveInlineLine = false;
  };

  return {
    render(event: { stage: string; message: string; iteration?: number }) {
      const prefix = event.iteration ? `[iter ${event.iteration}]` : defaultPrefix;
      const line = formatCliLine(`${prefix} ${event.message}`, resolveKind(event.stage), options);
      const useInlineUpdate = /llm-waiting/i.test(event.stage) && Boolean(process.stderr.isTTY);

      if (useInlineUpdate) {
        preservedWaitingLine = line;
        waitingLine = line;
        if (suspended) {
          return;
        }
        drawWaitingLine();
        startSpinner();
        return;
      }

      clearInlineLine();
      process.stderr.write(`${line}\n`);
    },
    temporarilyClear() {
      clearInlineLine(true);
    },
    redrawWaiting() {
      if (!preservedWaitingLine) return;
      waitingLine = preservedWaitingLine;
      drawWaitingLine();
      startSpinner();
    },
    suspend() {
      suspended = true;
      stopSpinner(true);
      clearInlineLine(true);
    },
    resume() {
      suspended = false;
      if (!preservedWaitingLine) return;
      waitingLine = preservedWaitingLine;
      drawWaitingLine();
      startSpinner();
    },
    flush() {
      suspended = false;
      stopSpinner();
      if (hasActiveInlineLine) {
        clearInlineLine();
      }
      if (footerReserved && process.stderr.isTTY) {
        process.stderr.write(buildFooterReserveEnd());
        footerReserved = false;
      }
      if (hasActiveInlineLine) {
        hasActiveInlineLine = false;
      }
    },
  };
}

const ROCKETCLAW2_BANNER = [
  '██████╗  ██████╗  ██████╗██╗  ██╗███████╗████████╗ ██████╗██╗      █████╗ ██╗    ██╗██████╗ ',
  '██╔══██╗██╔═══██╗██╔════╝██║ ██╔╝██╔════╝╚══██╔══╝██╔════╝██║     ██╔══██╗██║    ██║╚════██╗',
  '██████╔╝██║   ██║██║     █████╔╝ █████╗     ██║   ██║     ██║     ███████║██║ █╗ ██║ █████╔╝',
  '██╔══██╗██║   ██║██║     ██╔═██╗ ██╔══╝     ██║   ██║     ██║     ██╔══██║██║███╗██║██╔═══╝ ',
  '██║  ██║╚██████╔╝╚██████╗██║  ██╗███████╗   ██║   ╚██████╗███████╗██║  ██║╚███╔███╔╝███████╗',
  '╚═╝  ╚═╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝    ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚══════╝',
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function supportsBannerColor(): boolean {
  if (!process.stderr.isTTY) return false;
  if (process.env.NO_COLOR) return false;
  if ((process.env.TERM ?? '').toLowerCase() === 'dumb') return false;
  return true;
}

function colorize(line: string, colorCode: number): string {
  return `\x1b[38;5;${colorCode}m${line}\x1b[0m`;
}

function shouldShowStartupBanner(argv: string[]): boolean {
  if (!process.stderr.isTTY) return false;
  if (argv.includes('--json')) return false;
  if (argv.includes('--help') || argv.includes('-h')) return false;
  if (argv.includes('--version') || argv.includes('-V')) return false;
  return true;
}

function renderStartupBanner(frameOffset = 0): string {
  const colors = [39, 45, 51, 87, 123, 159];
  const width = process.stderr.columns ?? 120;
  const centered = ROCKETCLAW2_BANNER.map((line) => {
    const pad = Math.max(0, Math.floor((width - line.length) / 2));
    return `${' '.repeat(pad)}${line}`;
  });

  const output = centered.map((line, index) => colorize(line, colors[(index + frameOffset) % colors.length])).join('\n');
  const subtitleText = 'guided autonomy runtime';
  const subtitle = colorize(subtitleText, colors[(frameOffset + 2) % colors.length]);
  const subtitlePad = ' '.repeat(Math.max(0, Math.floor((width - subtitleText.length) / 2)));
  return `${output}\n${subtitlePad}${subtitle}\n\n`;
}

async function maybeShowStartupBanner(argv: string[]) {
  if (!shouldShowStartupBanner(argv)) return;
  if (!supportsBannerColor()) {
    process.stderr.write('RocketClaw2\n\n');
    return;
  }

  const shouldAnimate = !process.env.CI && process.env.RC2_NO_ANIMATION !== '1';
  if (!shouldAnimate) {
    process.stderr.write(renderStartupBanner());
    return;
  }

  const frameCount = 3;
  const bannerHeight = ROCKETCLAW2_BANNER.length + 2;
  process.stderr.write('\x1b[?25l');
  try {
    for (let frame = 0; frame < frameCount; frame += 1) {
      if (frame > 0) {
        process.stderr.write(`\x1b[${bannerHeight}F`);
      }
      process.stderr.write(renderStartupBanner(frame));
      await sleep(70);
    }
  } finally {
    process.stderr.write('\x1b[?25h');
  }
}

const program = new Command();

program
  .option('--timestamps', 'prefix human-readable CLI log lines with a timestamp')
  .option('--no-stream', 'disable streamed LLM output for CLI commands that support it')
  .option('--llm-base-url <url>', 'override LLM base URL for this CLI session only')
  .option('--llm-api-key <key>', 'override LLM API key for this CLI session only')
  .option('--llm-model <model>', 'override LLM model for this CLI session only')
  .option('--llm-mode <mode>', 'override LLM mode for this CLI session only (live|mock)')
  .option('--llm-retry-count <n>', 'override LLM server-error retry count for this CLI session only');

program
  .name('rocketclaw2')
  .description('RocketClaw2, a Node.js and TypeScript reimplementation of RocketClaw')
  .version('0.2.0');


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
  .option('--json', 'output raw JSON (default)')
  .option('--summary', 'show compact summary of candidates')
  .action(async (options) => {
    const plan = await buildConsolidationPlan();
    if (options.summary) {
      if (plan.length === 0) {
        console.log('No consolidation candidates found.');
        return;
      }
      console.log(`Consolidation Plan: ${plan.length} candidate(s)`);
      const promoteCount = plan.filter(c => c.suggestedAction === 'promote').length;
      const summarizeCount = plan.filter(c => c.suggestedAction === 'summarize').length;
      console.log(`- Promote:   ${promoteCount}`);
      console.log(`- Summarize: ${summarizeCount}`);
      return;
    }
    console.log(JSON.stringify(plan, null, 2));
  });

program
  .command('dream-run')
  .description('Run the dreaming loop: promote all high-salience candidates into semantic memory')
  .option('--dry-run', 'show what would be promoted without actually promoting')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const plan = await buildConsolidationPlan();
    const promotees = plan.filter((c) => c.suggestedAction === 'promote');
    if (promotees.length === 0) {
      console.log('No candidates meet the promote threshold (salience >= 30).');
      return;
    }
    if (options.dryRun) {
      console.log(`Would promote ${promotees.length} candidate(s):`);
      console.log(JSON.stringify(promotees, null, 2));
      return;
    }
    for (const candidate of promotees) {
      await rememberCandidate(candidate);
    }
    console.log(`Promoted ${promotees.length} candidate(s) into semantic memory.`);
    if (options.json) {
      console.log(JSON.stringify(promotees, null, 2));
    }
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
    const rootConfig = await loadAppConfig();
    const globalOpts = (command as any).parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
      llmRetryCount: parseOptionalNonNegativeInt(globalOpts.llmRetryCount, '--llm-retry-count'),
      llmMode: globalOpts.llmMode,
    });
    const summary = buildSystemSummary(config);
    console.log(options.json ? JSON.stringify(summary, null, 2) : formatSystemSummary(summary));
  });

program
  .command('world-model')
  .description('Show a structured world-model snapshot for planning, handoff, and situational awareness')
  .option('--json', 'output raw JSON')
  .action(async (options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = (command as any).parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
      llmRetryCount: parseOptionalNonNegativeInt(globalOpts.llmRetryCount, '--llm-retry-count'),
      llmMode: globalOpts.llmMode,
    });
    const model = await buildWorldModel(undefined, config);
    console.log(options.json ? JSON.stringify(model, null, 2) : formatWorldModel(model));
  });

program
  .command('handoff-create')
  .description('Persist a handoff artifact from the current world-model snapshot')
  .option('--preset <name>', 'pm|architect|implementer|reviewer|qa')
  .option('--owner <name>', 'assign an intended owner for this handoff')
  .option('--notes <text>', 'attach operator notes to this handoff')
  .option('--related-harness-id <id>', 'link this handoff to a harness plan/run artifact')
  .option('--related-approval-id <id>', 'link this handoff to an approval request')
  .option('--json', 'output raw JSON')
  .action(async (options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = (command as any).parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
      llmRetryCount: parseOptionalNonNegativeInt(globalOpts.llmRetryCount, '--llm-retry-count'),
      llmMode: globalOpts.llmMode,
    });
    const preset = resolveHandoffPreset(typeof options.preset === 'string' ? options.preset : undefined);
    const artifact = await createHandoffArtifact(config, undefined, {
      owner: typeof options.owner === 'string' ? options.owner : preset.owner,
      notes: typeof options.notes === 'string' ? options.notes : preset.notes,
      relatedHarnessId: typeof options.relatedHarnessId === 'string' ? options.relatedHarnessId : undefined,
      relatedApprovalId: typeof options.relatedApprovalId === 'string' ? options.relatedApprovalId : undefined,
    });
    console.log(options.json ? JSON.stringify(artifact, null, 2) : formatHandoffArtifact(artifact));
  });

program
  .command('handoff-list')
  .description('List persisted handoff artifacts')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const artifacts = await listHandoffArtifacts();
    console.log(options.json ? JSON.stringify(artifacts, null, 2) : formatHandoffList(artifacts));
  });

program
  .command('handoff-show')
  .description('Show a persisted handoff artifact by id')
  .requiredOption('--id <id>', 'handoff artifact id')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const artifact = await loadHandoffArtifact(String(options.id));
    if (!artifact) {
      throw new Error(`Handoff artifact not found: ${String(options.id)}`);
    }
    console.log(options.json ? JSON.stringify(artifact, null, 2) : formatHandoffArtifact(artifact));
  });

program
  .command('team-role-template')
  .description('Generate a scoped brief template for a Multi-Agent Teams role')
  .requiredOption('--role <role>', 'pm|architect|implementer|reviewer|qa')
  .option('--goal <text>', 'shared goal for this role')
  .option('--from-handoff-id <id>', 'derive the brief from an existing handoff artifact')
  .option('--scope <text>', 'explicit ownership boundary for this role')
  .option('--input <text...>', 'input artifacts or context to pass to this role')
  .option('--deliverable <text>', 'expected output from this role')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const role = normalizeTeamRole(String(options.role));
    const inputs = Array.isArray(options.input) ? options.input.map((item: unknown) => String(item)) : undefined;
    const template = options.fromHandoffId
      ? await loadHandoffArtifact(String(options.fromHandoffId)).then((handoff) => {
          if (!handoff) {
            throw new Error(`Handoff artifact not found: ${String(options.fromHandoffId)}`);
          }
          return buildRoleTemplateFromHandoff({
            role,
            handoff,
            scope: typeof options.scope === 'string' ? options.scope : undefined,
            deliverable: typeof options.deliverable === 'string' ? options.deliverable : undefined,
            extraInputs: inputs,
          });
        })
      : buildRoleTemplate({
          role,
          goal: typeof options.goal === 'string' ? options.goal : '',
          scope: typeof options.scope === 'string' ? options.scope : undefined,
          inputs,
          deliverable: typeof options.deliverable === 'string' ? options.deliverable : undefined,
        });

    if (!options.fromHandoffId && !options.goal) {
      throw new Error('Provide either --goal or --from-handoff-id');
    }

    console.log(options.json ? JSON.stringify(template, null, 2) : formatRoleTemplate(template));
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
    const globalOpts = (command as any).parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
      llmRetryCount: parseOptionalNonNegativeInt(globalOpts.llmRetryCount, '--llm-retry-count'),
      llmMode: globalOpts.llmMode,
    });
    await runChatSession({ title: options.title, sessionId: options.sessionId, config, stream: Boolean(globalOpts.stream) });
  });

program
  .command('tui')
  .description('Start the advanced terminal user interface (TUI)')
  .option('--title <title>', 'title for a new session')
  .option('--session-id <id>', 'resume an existing session')
  .action(async (options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = (command as any).parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
      llmRetryCount: parseOptionalNonNegativeInt(globalOpts.llmRetryCount, '--llm-retry-count'),
      llmMode: globalOpts.llmMode,
    });
    
    const tui = createRocketClawTUI(config);
    tui.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      tui.stop();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      tui.stop();
      process.exit(0);
    });
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
  .option('--limit <n>', 'show only the last n messages in human-readable mode', '10')
  .option('--summary', 'show compact session overview instead of message transcript')
  .action(async (options) => {
    const session = await loadSession(options.id);
    if (!session) {
      console.error(`Session not found: ${options.id}`);
      process.exitCode = 1;
      return;
    }
    if (options.json) {
      console.log(JSON.stringify(session, null, 2));
      return;
    }
    if (options.summary) {
      console.log(formatSessionOverview(session));
      return;
    }
    const limit = Math.max(0, Number(options.limit ?? 10));
    console.log(formatSessionDetail(session, { limit }));
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
  .command('whatsapp-qr')
  .description('Generate or authorize a simple WhatsApp QR bootstrap session')
  .option('--authorize <token>', 'authorize a previously generated QR token')
  .option('--phone-number <number>', 'phone number for the authorized WhatsApp session')
  .action(async (options) => {
    if (options.authorize) {
      await authorizeWhatsAppQrToken({ qrToken: options.authorize, phoneNumber: options.phoneNumber });
      console.log(options.phoneNumber
        ? 'Authorized WhatsApp QR session and synced ownPhoneNumber into config.'
        : 'Authorized WhatsApp QR session.');
      return;
    }
    const qr = createWhatsAppQrSession();
    console.log(JSON.stringify(qr, null, 2));
  });

program
  .command('whatsapp-session')
  .description('Inspect or manage the persisted local WhatsApp session profile')
  .option('--set-token <token>', 'persist a local WhatsApp session token')
  .option('--phone-number <number>', 'associate a phone number with the local session')
  .option('--clear', 'clear the persisted WhatsApp session profile')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    if (options.clear) {
      await clearWhatsAppSession();
      console.log('Cleared WhatsApp session profile.');
      return;
    }
    if (options.setToken) {
      await saveWhatsAppSession({
        mode: 'session',
        token: options.setToken,
        phoneNumber: options.phoneNumber,
        createdAt: new Date().toISOString(),
      });
      if (options.phoneNumber) {
        await syncWhatsAppOwnPhoneNumber(options.phoneNumber);
      }
      console.log(options.phoneNumber
        ? 'Saved WhatsApp session profile and synced ownPhoneNumber into config.'
        : 'Saved WhatsApp session profile.');
      return;
    }
    const session = await loadWhatsAppSession();
    console.log(options.json ? JSON.stringify(session, null, 2) : formatWhatsAppSessionProfile(session));
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
  .command('whatsapp-outbox')
  .description('Show persisted outbound WhatsApp native-session events')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const items = await listWhatsAppNativeOutbox();
    const text = items.map((item) => `${item.createdAt} | ${item.from} -> ${item.to} | ${item.text}`).join('\n');
    console.log(options.json ? JSON.stringify(items, null, 2) : text || 'No outbound WhatsApp native-session events.');
  });

program
  .command('messaging-summary')
  .description('Show configured messaging integration summary')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const config = await loadAppConfig();
    const session = await loadWhatsAppSession();
    const summary = {
      ...config.messaging,
      sessionState: {
        whatsapp: session,
      },
    };
    console.log(options.json ? JSON.stringify(summary, null, 2) : formatMessagingSummary(config.messaging, { whatsappSession: session }));
  });

program
  .command('whatsapp-config')
  .description('Inspect or update WhatsApp integration settings')
  .option('--enabled <value>', 'true|false')
  .option('--mode <mode>', 'mock|webhook|session')
  .option('--webhook-url <url>', 'webhook URL for WhatsApp delivery bridge')
  .option('--default-recipient <id>', 'default WhatsApp recipient or chat id')
  .option('--self-chat-only <value>', 'true|false, keep native session traffic limited to self chat by default')
  .option('--own-phone-number <value>', 'phone number used for self-chat enforcement and native-session identity')
  .action(async (options) => {
    if (!options.enabled && !options.mode && !options.webhookUrl && !options.defaultRecipient && !options.selfChatOnly && !options.ownPhoneNumber) {
      const config = await loadAppConfig();
      console.log(JSON.stringify(config.messaging.whatsapp, null, 2));
      return;
    }

    const next = await configureWhatsApp({
      ...(options.enabled ? { enabled: options.enabled === 'true' } : {}),
      ...(options.mode ? { mode: options.mode } : {}),
      ...(options.webhookUrl ? { webhookUrl: options.webhookUrl } : {}),
      ...(options.defaultRecipient ? { defaultRecipient: options.defaultRecipient } : {}),
      ...(options.selfChatOnly ? { selfChatOnly: options.selfChatOnly === 'true' } : {}),
      ...(options.ownPhoneNumber ? { ownPhoneNumber: options.ownPhoneNumber } : {}),
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
  .option('--summary', 'show compact chain summary')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const chain = await buildHarnessChain(options.id);
    if (options.json) {
      console.log(JSON.stringify(chain, null, 2));
      return;
    }
    console.log(options.summary ? formatHarnessChainSummary(chain) : formatHarnessChain(chain));
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
    const entries = filterIterationEntries(await loadIterationEntries(options.id), {
      latest: Boolean(options.latest),
      failedOnly: Boolean(options.failedOnly),
      iteration: options.iteration ? Number(options.iteration) : null,
    });
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
  .option('--edit-mode <mode>', 'edit format for implementation artifacts (full-file|diff|mixed)', 'mixed')
  .option('--verbose', 'show formatted raw LLM requests and responses on stderr')
  .option('--json', 'output raw JSON')
  .action(async (options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = (command as any).parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
      llmRetryCount: parseOptionalNonNegativeInt(globalOpts.llmRetryCount, '--llm-retry-count'),
      llmMode: globalOpts.llmMode,
    });
    const renderOptions = { timestamps: Boolean(globalOpts.timestamps) };
    const progressRenderer = options.json ? undefined : createProgressRenderer('[plan]', renderOptions);
    const verboseRenderer = options.verbose ? createVerboseLlmRenderer(renderOptions, progressRenderer) : undefined;
    const streamRenderer = Boolean(globalOpts.stream) ? (verboseRenderer ?? createStreamTextRenderer(renderOptions, progressRenderer)) : undefined;
    let result;
    try {
      result = await buildHarnessPlan(config, {
        workspace: options.workspace,
        task: options.task,
        validateCommand: options.validate,
        editMode: parseEditMode(options.editMode),
      }, verboseRenderer ? (event) => {
        verboseRenderer.render(event);
      } : undefined, progressRenderer ? (event) => {
        progressRenderer.render(event);
      } : undefined, streamRenderer ? (chunk, label) => {
        streamRenderer.streamChunk(chunk, label);
      } : undefined);
    } finally {
      streamRenderer?.finishStream?.();
      progressRenderer?.flush();
    }
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
  .option('--max-iterations <n>', 'maximum iterations', '5')
  .option('--validate-timeout-ms <n>', 'validation timeout in milliseconds (default: no timeout)')
  .option('--edit-mode <mode>', 'edit format for implementation artifacts (full-file|diff|mixed)')
  .option('--verbose', 'show formatted raw LLM requests and responses on stderr')
  .option('--json', 'output raw JSON')
  .action(async (options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = (command as any).parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
      llmRetryCount: parseOptionalNonNegativeInt(globalOpts.llmRetryCount, '--llm-retry-count'),
      llmMode: globalOpts.llmMode,
    });
    const renderOptions = { timestamps: Boolean(globalOpts.timestamps) };
    const progressRenderer = options.json ? undefined : createProgressRenderer('[plan-run]', renderOptions);
    const verboseRenderer = options.verbose ? createVerboseLlmRenderer(renderOptions, progressRenderer) : undefined;
    const streamRenderer = Boolean(globalOpts.stream) ? (verboseRenderer ?? createStreamTextRenderer(renderOptions, progressRenderer)) : undefined;
    let result;
    try {
      result = await runCodingHarnessFromPlan(config, options.id, {
        maxIterations: Number(options.maxIterations),
        validateTimeoutMs: options.validateTimeoutMs ? Number(options.validateTimeoutMs) : undefined,
        editMode: parseEditMode(options.editMode),
        onProgress: progressRenderer ? (event) => {
          progressRenderer.render(event);
        } : undefined,
        onLlmTrace: verboseRenderer ? (event) => {
          verboseRenderer.render(event);
        } : undefined,
        onLlmToken: streamRenderer ? (chunk, label) => {
          streamRenderer.streamChunk(chunk, label);
        } : undefined,
      });
    } finally {
      streamRenderer?.finishStream?.();
      progressRenderer?.flush();
    }
    console.log(options.json ? JSON.stringify(result, null, 2) : formatCodingHarnessResult(result));
    if (!result.ok) process.exitCode = 1;
  });

program
  .command('harness-run')
  .description('Run an autonomous coding harness loop for a workspace task until validation passes or iterations are exhausted')
  .option('--id <plan-id>', 'approved harness plan id to execute through the governed path')
  .option('--workspace <path>', 'target workspace path')
  .option('--task <text>', 'task description')
  .option('--validate <cmd>', 'validation command to run in the workspace')
  .option('--max-iterations <n>', 'maximum iterations', '5')
  .option('--validate-timeout-ms <n>', 'validation timeout in milliseconds (default: no timeout)')
  .option('--edit-mode <mode>', 'edit format for implementation artifacts (full-file|diff|mixed)', 'mixed')
  .option('--verbose', 'show formatted raw LLM requests and responses on stderr')
  .option('--require-approved-plan', 'refuse direct execution unless --id references an approved plan artifact')
  .option('--json', 'output raw JSON')
  .action(async (options, command) => {
    if (options.requireApprovedPlan && !options.id) {
      throw new Error('Direct harness-run is disabled in require-approved-plan mode. Preferred path: use auto-code --no-auto-approve to create a reviewable plan, then harness-approve, then harness-run --id <plan-id> --require-approved-plan. Lower-level path: harness-plan, harness-approve, then harness-run --id <plan-id> --require-approved-plan.');
    }
    const rootConfig = await loadAppConfig();
    const globalOpts = (command as any).parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
      llmRetryCount: parseOptionalNonNegativeInt(globalOpts.llmRetryCount, '--llm-retry-count'),
      llmMode: globalOpts.llmMode,
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
    const editMode = parseEditMode(resolved?.editMode ?? options.editMode);
    if (!workspace || !task || !validateCommand) {
      throw new Error('harness-run requires either --id <plan-id> or all of --workspace, --task, and --validate');
    }
    const renderOptions = { timestamps: Boolean(globalOpts.timestamps) };
    const progressRenderer = options.json ? undefined : createProgressRenderer('[progress]', renderOptions);
    const verboseRenderer = options.verbose ? createVerboseLlmRenderer(renderOptions, progressRenderer) : undefined;
    const streamRenderer = Boolean(globalOpts.stream) ? (verboseRenderer ?? createStreamTextRenderer(renderOptions, progressRenderer)) : undefined;
    let result;
    try {
      result = await runCodingHarness(config, {
        workspace,
        task,
        validateCommand,
        maxIterations: Number(options.maxIterations),
        validateTimeoutMs: options.validateTimeoutMs ? Number(options.validateTimeoutMs) : undefined,
        editMode,
      }, progressRenderer ? (event) => {
        progressRenderer.render(event);
      } : undefined, verboseRenderer ? (event) => {
        verboseRenderer.render(event);
      } : undefined, streamRenderer ? (chunk, label) => {
        streamRenderer.streamChunk(chunk, label);
      } : undefined);
    } finally {
      streamRenderer?.finishStream?.();
      progressRenderer?.flush();
    }
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
    const globalOpts = (command as any).parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
      llmRetryCount: parseOptionalNonNegativeInt(globalOpts.llmRetryCount, '--llm-retry-count'),
      llmMode: globalOpts.llmMode,
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
    const globalOpts = (command as any).parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
      llmRetryCount: parseOptionalNonNegativeInt(globalOpts.llmRetryCount, '--llm-retry-count'),
      llmMode: globalOpts.llmMode,
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
  .option('--preset <name>', 'validate|build|lint|docs|pack')
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
  .command('approval-resolve-all')
  .description('Resolve all pending approvals in bulk')
  .requiredOption('--status <status>', 'approved|rejected')
  .action(async (options) => {
    const items = await loadApprovals();
    const pending = items.filter((item) => item.status === 'pending');
    if (pending.length === 0) {
      console.log('No pending approvals to resolve.');
      return;
    }
    const result = await bulkResolveApprovals(pending.map((p) => p.id), options.status);
    console.log(`Resolved ${result.resolved} approvals as ${options.status}, ${result.notFound} not found.`);
  });

program
  .command('approval-purge')
  .description('Purge pending approvals older than --days (default 7)')
  .option('--days <number>', 'purge approvals older than this many days', '7')
  .action(async (options) => {
    const days = Number(options.days);
    if (isNaN(days) || days < 1) {
      console.error('--days must be a positive number');
      process.exitCode = 1;
      return;
    }
    const purged = await purgeStaleApprovals(days);
    console.log(`Purged ${purged} stale pending approvals older than ${days} days.`);
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
    const globalOpts = (command as any).parent?.opts?.() ?? {};
    const hasOverrides = Boolean(globalOpts.llmBaseUrl || globalOpts.llmApiKey || globalOpts.llmModel || globalOpts.llmMode || globalOpts.llmRetryCount !== undefined);
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
      llmRetryCount: parseOptionalNonNegativeInt(globalOpts.llmRetryCount, '--llm-retry-count'),
      llmMode: globalOpts.llmMode,
    });
    const status = buildLlmStatus(config, hasOverrides);
    console.log(options.json ? JSON.stringify(status, null, 2) : formatLlmStatus(status));
  });

program
  .command('llm-stats')
  .description('Show LLM performance stats for a period, channel, or specific session')
  .option('--period <days>', 'lookback period in days', '7')
  .option('--session-id <id>', 'filter to a specific session id')
  .option('--channel <name>', 'filter to a specific channel')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const stats = await getLlmPerformanceStats({
      periodStart: new Date(Date.now() - Number(options.period) * 86400 * 1000).toISOString(),
      sessionId: options.sessionId,
      channel: options.channel,
    });
    console.log(options.json ? JSON.stringify(stats, null, 2) : formatLlmPerformanceStats(stats));
  });

program
  .command('llm-test')
  .description('Run a quick connectivity and auth test against the configured LLM')
  .action(async (_options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = (command as any).parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
      llmRetryCount: parseOptionalNonNegativeInt(globalOpts.llmRetryCount, '--llm-retry-count'),
      llmMode: globalOpts.llmMode,
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
  .option('--verbose', 'show formatted raw LLM request and response details on stderr')
  .action(async (options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = (command as any).parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
      llmRetryCount: parseOptionalNonNegativeInt(globalOpts.llmRetryCount, '--llm-retry-count'),
      llmMode: globalOpts.llmMode,
    });
    try {
      const verboseRenderer = options.verbose ? createVerboseLlmRenderer({ timestamps: Boolean(globalOpts.timestamps) }) : undefined;
      let streamed = false;
      const response = await runLlmQuery(config, options.prompt, {
        channel: 'cli',
        label: 'llm-query',
        onTrace: verboseRenderer ? (event) => verboseRenderer.render(event) : undefined,
        stream: Boolean(globalOpts.stream),
        onToken: globalOpts.stream ? ((chunk) => {
          streamed = true;
          process.stdout.write(chunk);
        }) : undefined,
      });
      if (streamed) {
        process.stdout.write('\n');
      } else {
        console.log(response);
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command('doctor')
  .description('Print basic runtime diagnostics')
  .option('--json', 'output raw JSON')
  .action(async (options) => {
    const report = await runDoctorChecks();
    console.log(options.json ? JSON.stringify(report, null, 2) : formatDoctorReport(report));
  });

// ── Heartbeat ────────────────────────────────────────────────────────────────
program
  .command('heartbeat')
  .description('Run a single heartbeat verification cycle')
  .option('--json', 'output raw JSON')
  .option('--interval <ms>', 'set verification interval in milliseconds (for continuous mode)')
  .option('--continuous', 'run in continuous mode with specified interval')
  .action(async (options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = (command as any).parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
      llmRetryCount: parseOptionalNonNegativeInt(globalOpts.llmRetryCount, '--llm-retry-count'),
      llmMode: globalOpts.llmMode,
    });
    const { createHeartbeatVerifier } = await import('./heartbeat/index.js');
    const verifier = createHeartbeatVerifier(config);
    
    if (options.continuous) {
      const interval = options.interval ? parseInt(options.interval) : 300000; // Default 5 minutes
      console.log(`[Heartbeat] Starting continuous verification (interval: ${interval}ms)`);
      verifier.start(interval);
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        verifier.stop();
        console.log('[Heartbeat] Verification stopped');
        process.exit(0);
      });
      process.on('SIGTERM', () => {
        verifier.stop();
        console.log('[Heartbeat] Verification stopped');
        process.exit(0);
      });
      
      // Keep process running
      return new Promise((resolve) => {
        // Resolve when stopped externally
        const checkInterval = setInterval(() => {
          if (!verifier.isRunning()) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 1000);
      });
    } else {
      // Single verification
      const result = await verifier.performVerification();
      console.log(options.json ? JSON.stringify(result, null, 2) : `Heartbeat Verification Complete
${'='.repeat(50)}
Overall Status: ${result.healthCheck.overallStatus.toUpperCase()}
Health Checks: ${result.healthCheck.checks.length} total
Queue Processed: ${result.queueProcessed.processed} ok, ${result.queueProcessed.failed} failed
Actions Taken: ${result.actionsTaken.length}
Recommendations: ${result.recommendations.length}`);
    }
  });

// ── Telemetry ────────────────────────────────────────────────────────────────// ── Telemetry ────────────────────────────────────────────────────────────────
program
  .command('telemetry')
  .description('Show telemetry summary (commands, errors, LLM, queue)')
  .option('--period <days>', 'lookback period in days', '7')
  .option('--perf', 'show per-command p50/p95 performance')
  .option('--deprecation', 'show deprecation candidates')
  .action(async (options) => {
    const summary = await computeSummary(
      new Date(Date.now() - Number(options.period) * 86400 * 1000).toISOString(),
    );
    console.log(formatTelemetrySummary(summary));
    if (options.perf) console.log(await formatPerfReport());
    if (options.deprecation) console.log(await formatDeprecationReport());
  });

// ── Queue ────────────────────────────────────────────────────────────────────
program
  .command('queue')
  .description('Inspect or process the request queue')
  .option('--stats', 'show queue statistics')
  .option('--process <limit>', 'process up to N pending items', '10')
  .option('--clear', 'clear done items older than 7 days')
  .action(async (options) => {
    const rootConfig = await loadAppConfig();
    const config = applySessionOverrides(rootConfig, {});
    if (options.stats) {
      const s = await getQueueStats();
      console.log(`\n📬 Queue Stats\n${'─'.repeat(30)}\n  pending:    ${s.pending}\n  processing: ${s.processing}\n  done:       ${s.done}\n  failed:     ${s.failed}`);
    }
    if (options.process) {
      const r = await runQueue(config, Number(options.process));
      console.log(`\nQueue processed: ${r.processed} ok, ${r.failed} failed`);
    }
    if (options.clear) {
      const n = await clearDoneItems();
      console.log(`\nCleared ${n} done item(s).`);
    }
  });

program
  .command('run')
  .description('Run the minimal runtime shell')
  .option('--profile <name>', 'config profile', 'default')
  .action(async (options) => {
    const config = loadConfig({ profile: options.profile });
    console.log(`RocketClaw2 runtime starting with profile: ${config.profile}`);
    
    // Start the background queue orchestrator
    const orchestrator = new QueueOrchestrator(config);
    orchestrator.start();
    console.log('Proactive queue orchestrator active.');

    // Keep process alive (minimal shell placeholder)
    process.on('SIGINT', () => {
      orchestrator.stop();
      process.exit(0);
    });
  });

program
  .command('auto-code')
  .description('Run a streamlined autonomous coding flow (plan, approve, execute) with smart defaults')
  .requiredOption('--workspace <path>', 'target workspace path')
  .requiredOption('--task <text>', 'task description')
  .option('--validate <cmd>', 'validation command to run in the workspace', 'echo "Task completed"')
  .option('--max-iterations <n>', 'maximum iterations', '5')
  .option('--no-auto-approve', 'do not auto-approve the plan; require manual approval')
  .option('--edit-mode <mode>', 'edit format for implementation artifacts (full-file|diff|mixed)', 'mixed')
  .option('--verbose', 'show formatted raw LLM requests and responses on stderr')
  .option('--json', 'output raw JSON')
  .action(async (options, command) => {
    const rootConfig = await loadAppConfig();
    const globalOpts = (command as any).parent?.opts?.() ?? {};
    const config = applySessionOverrides(rootConfig, {
      llmBaseUrl: globalOpts.llmBaseUrl,
      llmApiKey: globalOpts.llmApiKey,
      llmModel: globalOpts.llmModel,
      llmRetryCount: parseOptionalNonNegativeInt(globalOpts.llmRetryCount, '--llm-retry-count'),
      llmMode: globalOpts.llmMode,
    });
    const autoApprove = options.autoApprove !== false;
    const renderOptions = { timestamps: Boolean(globalOpts.timestamps) };
    const progressRenderer = options.json ? undefined : createProgressRenderer('[auto-code]', renderOptions);
    const verboseRenderer = options.verbose ? createVerboseLlmRenderer(renderOptions, progressRenderer) : undefined;
    const streamRenderer = Boolean(globalOpts.stream) ? (verboseRenderer ?? createStreamTextRenderer(renderOptions, progressRenderer)) : undefined;
    let result;
    try {
      result = await runAutoCode(
        config,
        options.workspace,
        options.task,
        options.validate,
        Number(options.maxIterations),
        autoApprove,
        progressRenderer ? (event) => {
          progressRenderer.render(event);
        } : undefined,
        verboseRenderer ? (event) => {
          verboseRenderer.render(event);
        } : undefined,
        streamRenderer ? (chunk, label) => {
          streamRenderer.streamChunk(chunk, label);
        } : undefined,
        parseEditMode(options.editMode),
      );
    } finally {
      streamRenderer?.finishStream?.();
      progressRenderer?.flush();
    }
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.ok) {
        console.log(formatCliLine(result.result ?? 'Autonomous coding completed successfully.', 'success', renderOptions, process.stdout));
        if (result.planId) {
          console.log(formatCliLine(`Plan ID: ${result.planId}`, 'info', renderOptions, process.stdout));
        }
        if (result.artifactPath) {
          console.log(formatCliLine(`Artifact: ${result.artifactPath}`, 'info', renderOptions, process.stdout));
        }
      } else {
        console.error(formatCliLine(result.error ?? 'Autonomous coding failed.', 'error', renderOptions));
        if (result.planId) {
          console.error(formatCliLine(`Plan ID: ${result.planId}`, 'info', renderOptions));
        }
        if (result.artifactPath) {
          console.error(formatCliLine(`Artifact: ${result.artifactPath}`, 'info', renderOptions));
        }
        if (result.nextSteps && result.nextSteps.length > 0) {
          console.error(formatCliLine('Next steps:', 'warn', renderOptions));
          for (const step of result.nextSteps) {
            console.error(formatCliLine(step, 'info', renderOptions));
          }
        }
        process.exitCode = 1;
      }
    }
  });

const normalizedArgv = normalizeCliArgv(process.argv);
await maybeShowStartupBanner(normalizedArgv);
await program.parseAsync(normalizedArgv);
