import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

describe('package scripts', () => {
  it('runs build verification automatically during prepack', async () => {
    const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
    expect(packageJson.scripts?.prepack).toBe('npm run build && npm run verify:build');
  });
});
