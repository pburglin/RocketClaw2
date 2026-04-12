import { loadApprovals } from '../approval/store.js';
import { getDefaultProjectRoot } from '../config/app-paths.js';
import { formatDoctorReport, runDoctorChecks } from '../core/doctor.js';
import { getRecommendedNextActions } from '../core/next-actions.js';
import { buildWorkspaceStatus, formatWorkspaceStatus } from '../core/workspace-status.js';
import { loadSemanticMemory } from '../memory/semantic-store.js';
import { listSessions, loadSession } from '../sessions/store.js';
import { loadAppConfig } from '../tools/config-store.js';
import type { WhatsAppInboundEvent } from './whatsapp-listener.js';
import { formatMessagingSummary } from './formatters.js';
import { loadWhatsAppSession } from './whatsapp-session.js';

export type WhatsAppDispatchResult = {
  matched: boolean;
  command?: string;
  replyText?: string;
};

function buildHelpText(): string {
  return [
    'RocketClaw2 WhatsApp commands:',
    '- status',
    '- doctor',
    '- next-actions',
    '- sessions',
    '- session <id-or-title>',
    '- approvals',
    '- memory',
    '- tools',
    '- messaging',
    '- help',
  ].join('\n');
}

async function buildSessionsReply(root: string): Promise<string> {
  const sessions = await listSessions(root);
  if (sessions.length === 0) return 'No sessions found.';

  const visible = sessions.slice(0, 5);
  const lines = ['Recent sessions:'];
  for (const session of visible) {
    lines.push(`- ${session.title} | messages=${session.messages.length} | updated=${session.updatedAt}`);
  }
  if (sessions.length > visible.length) {
    lines.push(`- ...and ${sessions.length - visible.length} more`);
  }
  return lines.join('\n');
}

async function buildSingleSessionReply(query: string, root: string): Promise<string> {
  const direct = await loadSession(query, root);
  if (direct) {
    const last = direct.messages.at(-1);
    return [
      `Session: ${direct.title}`,
      `ID: ${direct.id}`,
      `Messages: ${direct.messages.length}`,
      `Updated: ${direct.updatedAt}`,
      `Last: ${last ? `[${last.role}] ${last.text}` : 'n/a'}`,
    ].join('\n');
  }

  const sessions = await listSessions(root);
  const lowered = query.toLowerCase();
  const match = sessions.find((session) => session.title.toLowerCase().includes(lowered));
  if (!match) {
    return `Session not found for: ${query}`;
  }

  const last = match.messages.at(-1);
  return [
    `Session: ${match.title}`,
    `ID: ${match.id}`,
    `Messages: ${match.messages.length}`,
    `Updated: ${match.updatedAt}`,
    `Last: ${last ? `[${last.role}] ${last.text}` : 'n/a'}`,
  ].join('\n');
}

async function buildApprovalsReply(root: string): Promise<string> {
  const approvals = await loadApprovals(root);
  const pending = approvals.filter((item) => item.status === 'pending');
  if (pending.length === 0) {
    return 'No pending approvals.';
  }

  const visible = pending.slice(0, 5);
  const lines = ['Pending approvals:'];
  for (const item of visible) {
    lines.push(`- ${item.kind} | ${item.target} | ${item.detail}`);
  }
  if (pending.length > visible.length) {
    lines.push(`- ...and ${pending.length - visible.length} more`);
  }
  return lines.join('\n');
}

async function buildMemoryReply(root: string): Promise<string> {
  const entries = await loadSemanticMemory(root);
  if (entries.length === 0) {
    return 'No semantic memory entries found.';
  }

  const visible = [...entries].sort((a, b) => b.salience - a.salience).slice(0, 5);
  const lines = ['Top semantic memory:'];
  for (const entry of visible) {
    lines.push(`- salience=${entry.salience} | tags=${entry.tags.join(',') || 'none'} | ${entry.text}`);
  }
  if (entries.length > visible.length) {
    lines.push(`- ...and ${entries.length - visible.length} more`);
  }
  return lines.join('\n');
}

async function buildToolsReply(root: string): Promise<string> {
  const config = await loadAppConfig(root);
  const counts = {
    disabled: config.tools.filter((tool) => tool.access === 'disabled').length,
    readOnly: config.tools.filter((tool) => tool.access === 'read-only').length,
    guardedWrite: config.tools.filter((tool) => tool.access === 'guarded-write').length,
    fullAccess: config.tools.filter((tool) => tool.access === 'full-access').length,
  };
  return [
    'Tool policy summary:',
    `- total=${config.tools.length}`,
    `- disabled=${counts.disabled}`,
    `- read-only=${counts.readOnly}`,
    `- guarded-write=${counts.guardedWrite}`,
    `- full-access=${counts.fullAccess}`,
  ].join('\n');
}

async function buildMessagingReply(root: string): Promise<string> {
  const [config, session] = await Promise.all([
    loadAppConfig(root),
    loadWhatsAppSession(root),
  ]);
  return formatMessagingSummary(config.messaging, { whatsappSession: session });
}

export async function dispatchWhatsAppInbound(
  event: WhatsAppInboundEvent,
  root = getDefaultProjectRoot(),
): Promise<WhatsAppDispatchResult> {
  const text = event.text.trim();

  if (/^(help|commands)$/i.test(text)) {
    return { matched: true, command: 'help', replyText: buildHelpText() };
  }

  if (/^(status|workspace-status)$/i.test(text)) {
    const status = await buildWorkspaceStatus(root);
    return { matched: true, command: 'workspace-status', replyText: formatWorkspaceStatus(status) };
  }

  if (/^(doctor)$/i.test(text)) {
    const report = await runDoctorChecks(root);
    return { matched: true, command: 'doctor', replyText: formatDoctorReport(report) };
  }

  if (/^(next|next-actions)$/i.test(text)) {
    const actions = await getRecommendedNextActions(root);
    return {
      matched: true,
      command: 'next-actions',
      replyText: actions.length > 0 ? actions.map((item) => `- ${item}`).join('\n') : 'No recommended next actions.',
    };
  }

  if (/^(sessions|session-list)$/i.test(text)) {
    return { matched: true, command: 'sessions', replyText: await buildSessionsReply(root) };
  }

  const sessionMatch = text.match(/^session\s+(.+)$/i);
  if (sessionMatch?.[1]) {
    return {
      matched: true,
      command: 'session-show',
      replyText: await buildSingleSessionReply(sessionMatch[1].trim(), root),
    };
  }

  if (/^(approvals|approval-pending)$/i.test(text)) {
    return {
      matched: true,
      command: 'approvals',
      replyText: await buildApprovalsReply(root),
    };
  }

  if (/^(memory|memory-list)$/i.test(text)) {
    return {
      matched: true,
      command: 'memory',
      replyText: await buildMemoryReply(root),
    };
  }

  if (/^(tools|tool-policy-summary)$/i.test(text)) {
    return {
      matched: true,
      command: 'tools',
      replyText: await buildToolsReply(root),
    };
  }

  if (/^(messaging|messaging-summary)$/i.test(text)) {
    return {
      matched: true,
      command: 'messaging-summary',
      replyText: await buildMessagingReply(root),
    };
  }

  return { matched: false };
}
