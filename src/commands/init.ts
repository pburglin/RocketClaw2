import fs from 'node:fs/promises';
import YAML from 'yaml';
import { getConfigPath, getDefaultProjectRoot, getMemoryDir, getStatePath } from '../config/app-paths.js';
import { loadConfig } from '../config/load-config.js';
import { createInitialState, saveState } from '../state/store.js';
import { buildDefaultToolPolicies } from '../tools/policy.js';

export async function runInit(profile: string): Promise<void> {
  const root = getDefaultProjectRoot();
  const configPath = getConfigPath(root);
  const statePath = getStatePath(root);
  const memoryDir = getMemoryDir(root);

  await fs.mkdir(root, { recursive: true });
  await fs.mkdir(memoryDir, { recursive: true });

  const config = {
    profile,
    created_by: 'rocketclaw2',
    memory: {
      provider: 'local-files',
      strategy: 'tiered-with-dreaming',
    },
    messaging: {
      whatsapp: {
        enabled: true,
        mode: 'mock',
      },
    },
    yolo: {
      enabled: false,
      warn: true,
    },
    llm: {
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
    },
    tools: buildDefaultToolPolicies(),
    recallScoring: loadConfig({}).recallScoring,
  };

  await fs.writeFile(configPath, YAML.stringify(config));
  await saveState(statePath, createInitialState(profile));
  await fs.writeFile(`${memoryDir}/README.md`, '# RocketClaw2 Memory\n\nThis directory stores episodic and curated memory artifacts.\n');

  console.log(`Initialized RocketClaw2 at ${root}`);
  console.log(`Config: ${configPath}`);
  console.log(`State: ${statePath}`);
  console.log(`Memory: ${memoryDir}`);
}
