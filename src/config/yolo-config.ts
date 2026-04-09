import { getDefaultProjectRoot } from './app-paths.js';
import { loadAppConfig, saveAppConfig } from '../tools/config-store.js';

export async function configureYolo(input: { enabled?: boolean; warn?: boolean }, root = getDefaultProjectRoot()) {
  const config = await loadAppConfig(root);
  const next = {
    ...config,
    yolo: {
      ...config.yolo,
      ...input,
    },
  };
  await saveAppConfig(next, root);
  return next.yolo;
}
