import { loadAppConfig } from '../tools/config-store.js';
import { buildSystemSummary, formatSystemSummary } from '../config/system-summary.js';

export async function runSetupWizard(): Promise<string> {
  const config = await loadAppConfig();
  const summary = buildSystemSummary(config);
  return [
    'RocketClaw2 Setup Wizard',
    '',
    'Current runtime posture:',
    formatSystemSummary(summary),
    '',
    'Recommended next steps:',
    '- review tool access with `rocketclaw2 tool-policy-summary`',
    '- inspect messaging with `rocketclaw2 messaging-summary`',
    '- configure WhatsApp defaults with `rocketclaw2 whatsapp-config`',
    '- inspect config with `rocketclaw2 config-show`',
    '- create or inspect sessions before using chat workflows',
  ].join('\n');
}
