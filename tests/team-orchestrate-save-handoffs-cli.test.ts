import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import YAML from 'yaml';

const execFileAsync = promisify(execFile);

describe('team-orchestrate handoff persistence', () => {
  it('can save one handoff artifact per stage from a direct goal', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-team-save-home-'));
    const root = path.join(home, '.rocketclaw2');
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({ messaging: { whatsapp: { enabled: false, mode: 'mock' } } }));

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      'team-orchestrate',
      '--goal', 'Ship a scoped runtime ergonomics improvement',
      '--save-handoffs',
      '--json',
    ], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: home },
    });

    const report = JSON.parse(stdout);
    expect(report.savedStages).toHaveLength(4);
    expect(report.savedStages[0].role).toBe('pm');
    expect(report.savedStages[0].chainDepth).toBe(0);
    expect(report.savedStages[1].parentHandoffId).toBe(report.savedStages[0].handoffId);
    expect(report.savedStages[1].chainDepth).toBe(1);
    expect(report.savedStages[2].parentHandoffId).toBe(report.savedStages[1].handoffId);
    expect(report.savedStages[2].chainDepth).toBe(2);
    expect(report.savedStages[3].parentHandoffId).toBe(report.savedStages[2].handoffId);
    expect(report.savedStages[3].chainDepth).toBe(3);

    const handoffDir = path.join(root, 'handoffs');
    const files = (await fs.readdir(handoffDir)).filter((file) => file.endsWith('.json'));
    expect(files).toHaveLength(4);

    const savedArtifacts = await Promise.all(
      files.map(async (file) => JSON.parse(await fs.readFile(path.join(handoffDir, file), 'utf8'))),
    );
    const pm = savedArtifacts.find((artifact) => artifact.handoff.owner === 'pm');
    const architect = savedArtifacts.find((artifact) => artifact.handoff.owner === 'architect');
    const implementer = savedArtifacts.find((artifact) => artifact.handoff.owner === 'implementer');
    const reviewer = savedArtifacts.find((artifact) => artifact.handoff.owner === 'reviewer');

    expect(pm?.activeGoal).toBe('Ship a scoped runtime ergonomics improvement');
    expect(pm?.handoffChain).toEqual([]);
    expect(architect?.parentHandoffId).toBe(pm?.id);
    expect(architect?.handoffChain).toEqual([pm?.id]);
    expect(implementer?.parentHandoffId).toBe(architect?.id);
    expect(implementer?.handoffChain).toEqual([pm?.id, architect?.id]);
    expect(reviewer?.parentHandoffId).toBe(implementer?.id);
    expect(reviewer?.handoffChain).toEqual([pm?.id, architect?.id, implementer?.id]);

    await fs.rm(home, { recursive: true, force: true });
  }, 15000);
});
