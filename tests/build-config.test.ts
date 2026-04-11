import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

describe('build tsconfig split', () => {
  it('uses a build-specific tsconfig that excludes tests from production output', async () => {
    const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
    const buildConfig = JSON.parse(await fs.readFile(path.join(root, 'tsconfig.build.json'), 'utf8'));

    expect(packageJson.scripts?.build).toBe('npm run clean && tsc -p tsconfig.build.json');
    expect(buildConfig.extends).toBe('./tsconfig.json');
    expect(buildConfig.include).toEqual(['src/**/*.ts']);
    expect(buildConfig.exclude).toContain('tests/**/*.ts');
  });
});
