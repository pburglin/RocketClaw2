import { getDefaultProjectRoot } from '../config/app-paths.js';
import { loadConfigFromDisk, type RecallScoringConfig } from '../config/load-config.js';

export type RuntimeSummary = {
  name: string;
  version: string;
  status: string;
  recallScoring?: RecallScoringConfig;
};

export async function getRuntimeSummary(root = getDefaultProjectRoot()): Promise<RuntimeSummary> {
  const config = await loadConfigFromDisk(root);
  return {
    name: 'RocketClaw2',
    version: '0.2.0',
    status: 'bootstrap-ready',
    recallScoring: config.recallScoring,
  };
}
