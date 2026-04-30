import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { saveHarnessRun } from '../src/harness/store.js';
import { saveIterationEntry } from '../src/harness/iteration-store.js';

const execFileAsync = promisify(execFile);

describe('evaluator-optimizer CLI', () => {
  it('evaluates a saved run with explicit criteria and revision history', async () => {
    const home = path.join(os.tmpdir(), `rocketclaw2-evaluator-home-${Date.now()}`);
    const root = path.join(home, '.rocketclaw2');

    await saveHarnessRun({
      ok: false,
      workspace: '/tmp/demo',
      task: 'Draft a feature plan',
      iterations: 2,
      lastGuidance: 'create package.json',
      lastCriticInsight: 'missing package.json',
      lastValidationStdout: '',
      lastValidationStderr: 'npm ERR',
      validateCommand: 'npm test',
      approvalStatus: 'approved',
      sourceHandoffId: 'handoff-9',
      sourceHandoffChain: ['handoff-1', 'handoff-5', 'handoff-9'],
      runId: 'run-123',
    } as any, root, 'run-123');

    await saveIterationEntry('run-123', {
      iteration: 1,
      timestamp: new Date().toISOString(),
      guidance: 'create package.json',
      criticInsight: 'missing package.json',
      filesCreated: ['package.json'],
      filesModified: [],
      validationPassed: false,
      validationStdout: '',
      validationStderr: 'npm ERR',
    }, root);

    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      'evaluator-optimizer',
      '--id',
      'run-123',
      '--criterion',
      'Validation passes cleanly',
      '--criterion',
      'No unresolved critic insight remains',
      '--decision',
      'needs-review',
      '--note',
      'Still failing validation.',
      '--json',
    ], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: home },
    });

    const report = JSON.parse(stdout);
    expect(report.criteria).toHaveLength(2);
    expect(report.criteria[0].status).toBe('failed');
    expect(report.criteria[1].status).toBe('failed');
    expect(report.revisionSummary.latestCriticInsight).toBe('missing package.json');
    expect(report.sourceHandoffId).toBe('handoff-9');
    expect(report.sourceHandoffChain).toEqual(['handoff-1', 'handoff-5', 'handoff-9']);
    expect(report.latestSavedDecision).toBe('needs-review');

    const artifact = JSON.parse(await fs.readFile(path.join(root, 'harness-runs', 'run-123.json'), 'utf8'));
    expect(artifact.evaluationDecision).toBe('needs-review');
    expect(artifact.evaluationNote).toBe('Still failing validation.');
    expect(artifact.evaluationHistory).toHaveLength(1);
    expect(artifact.latestEvaluation.sourceHandoffId).toBe('handoff-9');
    expect(artifact.latestEvaluation.sourceHandoffChain).toEqual(['handoff-1', 'handoff-5', 'handoff-9']);

    await fs.rm(home, { recursive: true, force: true });
  }, 15000);
});
