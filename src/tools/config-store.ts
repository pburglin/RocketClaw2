import fs from 'node:fs/promises';
import YAML from 'yaml';
import { join } from 'node:path';
import { getConfigPath, getDefaultProjectRoot } from '../config/app-paths.js';
import { AppConfigSchema, type AppConfig } from '../config/load-config.js';
import type { ToolPolicy } from './policy.js';

export async function loadAppConfig(root = getDefaultProjectRoot()): Promise<AppConfig> {
  // Load the base config from the agent's config (e.g., openclaw.json)
  const agentConfigPath = getConfigPath(root);
  let baseConfig: AppConfig = AppConfigSchema.parse({});
  try {
    const raw = await fs.readFile(agentConfigPath, 'utf8');
    baseConfig = AppConfigSchema.parse(YAML.parse(raw));
  } catch {
    // If the agent config doesn't exist or is invalid, start with defaults
    baseConfig = AppConfigSchema.parse({});
  }

  // Load the RocketClaw2 specific config (from ~/.rocketclaw2/config.yaml) and merge the llm section
  try {
    const rocketclaw2ConfigPath = join(getDefaultProjectRoot(), 'config.yaml');
    const raw = await fs.readFile(rocketclaw2ConfigPath, 'utf8');
    const rocketclaw2Config = YAML.parse(raw) ?? {};
    if (rocketclaw2Config.llm) {
      baseConfig.llm = { ...baseConfig.llm, ...rocketclaw2Config.llm };
    }
  } catch {
    // If the RocketClaw2 config doesn't exist or cannot be read, we just use the base config.
  }

  return baseConfig;
}

export async function saveAppConfig(config: AppConfig, root = getDefaultProjectRoot()): Promise<void> {
  const path = getConfigPath(root);
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(path, YAML.stringify(AppConfigSchema.parse(config)));
}

export async function setToolPolicy(toolId: string, patch: Partial<ToolPolicy>, root = getDefaultProjectRoot()): Promise<AppConfig> {
  const config = await loadAppConfig(root);
  const nextTools = config.tools.map((tool) => (tool.toolId === toolId ? { ...tool, ...patch } : tool));
  const nextConfig = { ...config, tools: nextTools };
  await saveAppConfig(nextConfig, root);
  return nextConfig;
}