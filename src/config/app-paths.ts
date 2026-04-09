import path from 'node:path';
import os from 'node:os';

export function getDefaultProjectRoot(): string {
  return path.join(os.homedir(), '.rocketclaw2');
}

export function getConfigPath(root = getDefaultProjectRoot()): string {
  return path.join(root, 'config.yaml');
}

export function getStatePath(root = getDefaultProjectRoot()): string {
  return path.join(root, 'state.json');
}

export function getMemoryDir(root = getDefaultProjectRoot()): string {
  return path.join(root, 'memory');
}
