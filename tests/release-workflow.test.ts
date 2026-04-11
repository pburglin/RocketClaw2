import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

describe('release workflow', () => {
  it('runs the full quality gate on version tags before optional npm publish', async () => {
    const workflowPath = path.join(root, '.github', 'workflows', 'release.yml');
    const yaml = await fs.readFile(workflowPath, 'utf8');

    expect(yaml).toContain('name: Release');
    expect(yaml).toContain("tags:");
    expect(yaml).toContain("- 'v*'");
    expect(yaml).toContain('node-version: 22');
    expect(yaml).toContain('run: npm ci');
    expect(yaml).toContain('run: npm run lint');
    expect(yaml).toContain('run: npm run build');
    expect(yaml).toContain('run: npm run verify:build');
    expect(yaml).toContain('run: npm test');
    expect(yaml).toContain('run: npm run verify:pack');
    expect(yaml).toContain('run: npm pack --ignore-scripts');
    expect(yaml).toContain('uses: actions/upload-artifact@v4');
    expect(yaml).toContain('name: rocketclaw2-release-package');
    expect(yaml).toContain("if: ${{ secrets.NPM_TOKEN != '' }}");
    expect(yaml).toContain('run: npm publish --access public');
  });
});
