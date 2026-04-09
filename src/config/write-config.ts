import fs from 'node:fs/promises';
import YAML from 'yaml';
import { getConfigPath, getDefaultProjectRoot } from './app-paths.js';
import type { AppConfig } from './load-config.js';

export async function writeConfigFile(config: AppConfig, root = getDefaultProjectRoot()): Promise<void> {
  const path = getConfigPath(root);
  await fs.mkdir(root, { recursive: true });
  const yaml = YAML.stringify(config);
  const annotated = [
    '# RocketClaw2 configuration',
    '#',
    '# LLM API key setup:',
    '# - Put your LLM provider API key under llm.apiKey below, or',
    '# - Use CLI session overrides like:',
    '#   rocketclaw2 --llm-base-url "https://example.com/v1" --llm-api-key "$API_KEY" doctor',
    '#',
    yaml,
  ].join('\n');
  await fs.writeFile(path, annotated);
}
