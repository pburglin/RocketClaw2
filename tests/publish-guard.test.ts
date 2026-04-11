import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

describe('publish guard', () => {
  it('runs build and pack verification automatically before publish', async () => {
    const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
    expect(packageJson.scripts?.prepublishOnly).toBe('npm run verify:build && npm run verify:pack');
  });
});
