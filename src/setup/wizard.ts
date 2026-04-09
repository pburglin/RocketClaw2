import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { loadAppConfig, saveAppConfig } from '../tools/config-store.js';
import { buildSystemSummary, formatSystemSummary } from '../config/system-summary.js';

export async function runSetupWizard(interactive = false): Promise<string> {
  const config = await loadAppConfig();

  if (interactive) {
    const rl = readline.createInterface({ input, output });
    try {
      const baseUrl = (await rl.question(`LLM base URL [${config.llm.baseUrl}]: `)).trim() || config.llm.baseUrl;
      const model = (await rl.question(`LLM model [${config.llm.model}]: `)).trim() || config.llm.model;
      const apiKey = (await rl.question('LLM API key (leave blank to keep current / unset): ')).trim();
      const whatsappRecipient = (await rl.question(`Default WhatsApp recipient [${config.messaging.whatsapp.defaultRecipient ?? ''}]: `)).trim();

      config.llm.baseUrl = baseUrl;
      config.llm.model = model;
      if (apiKey) config.llm.apiKey = apiKey;
      if (whatsappRecipient) config.messaging.whatsapp.defaultRecipient = whatsappRecipient;

      await saveAppConfig(config);
    } finally {
      rl.close();
    }
  }

  const summary = buildSystemSummary(config);
  return [
    interactive ? 'RocketClaw2 Interactive Setup Wizard' : 'RocketClaw2 Setup Wizard',
    '',
    'Current runtime posture:',
    formatSystemSummary(summary),
    '',
    'LLM setup guidance:',
    '- Set llm.baseUrl and llm.model in config.yaml as needed',
    '- Set llm.apiKey in config.yaml if you want a persisted API key',
    '- Or use CLI session overrides: --llm-base-url, --llm-api-key, --llm-model',
    '',
    'Recommended next steps:',
    '- review tool access with `rocketclaw2 tool-policy-summary`',
    '- inspect messaging with `rocketclaw2 messaging-summary`',
    '- configure WhatsApp defaults with `rocketclaw2 whatsapp-config`',
    '- inspect config with `rocketclaw2 config-show`',
    '- create or inspect sessions before using chat workflows',
  ].join('\n');
}
