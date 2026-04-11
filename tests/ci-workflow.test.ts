import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

describe('CI workflow', () => {
  it('runs lint, build, build verification, and tests on push and pull requests', async () => {
    const workflowPath = path.join(root, '.github', 'workflows', 'ci.yml');
    const yaml = await fs.readFile(workflowPath, 'utf8');

    expect(yaml).toContain('name: CI');
    expect(yaml).toContain('push:');
    expect(yaml).toContain('pull_request:');
    expect(yaml).toContain('node-version: 22');
    expect(yaml).toContain('run: npm ci');
    expect(yaml).toContain('run: npm run lint');
    expect(yaml).toContain('run: npm run build');
    expect(yaml).toContain('run: npm run verify:build');
    expect(yaml).toContain('run: npm test');
    expect(yaml).toContain('run: npm run verify:pack');
    expect(yaml).toContain('run: npm pack --ignore-scripts');
    expect(yaml).toContain('uses: actions/upload-artifact@v4');
    expect(yaml).toContain("name: rocketclaw2-package");
    expect(yaml).toContain("path: '*.tgz'");
  });
});
