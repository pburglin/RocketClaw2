import fs from 'node:fs/promises';
import YAML from 'yaml';
import { getConfigPath, getDefaultProjectRoot } from '../config/app-paths.js';
import { AppConfigSchema, type AppConfig } from '../config/load-config.js';
import type { ToolPolicy } from './policy.js';

export async function loadAppConfig(root = getDefaultProjectRoot()): Promise<AppConfig> {
  const path = getConfigPath(root);
  try {
    const raw = await fs.readFile(path, 'utf8');
    return AppConfigSchema.parse(YAML.parse(raw));
  } catch {
    return AppConfigSchema.parse({});
  }
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
