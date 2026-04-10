import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildHarnessChain, saveHarnessRun } from '../src/harness/store.js';
import { formatHarnessChain } from '../src/harness/formatters.js';
import { saveIterationEntry } from '../src/harness/iteration-store.js';

describe('harness chain', () => {
  it('builds a consolidated chain view from a run artifact', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-chain-${Date.now()}`);
    const plan = await saveHarnessRun({
      kind: 'plan',
      ok: true,
      approvalStatus: 'approved',
      workspace: '/tmp/demo',
      task: 'ship feature',
      validateCommand: 'npm test',
      planText: 'Summary',
      runId: 'plan-1',
    }, root, 'plan-1');

    const run = await saveHarnessRun({
      ok: false,
      workspace: '/tmp/demo',
      task: 'ship feature',
      iterations: 2,
      lastGuidance: 'retry',
      lastValidationStdout: '',
      lastValidationStderr: 'boom',
      validateCommand: 'npm test',
      executedPlanId: plan.runId,
      runId: 'run-1',
    }, root, 'run-1');

    await saveHarnessRun({
      ok: false,
      workspace: '/tmp/demo',
      task: 'ship feature',
      iterations: 1,
      lastGuidance: 'resume',
      lastValidationStdout: '',
      lastValidationStderr: 'boom again',
      validateCommand: 'npm test',
      resumedFrom: run.runId,
      runId: 'run-2',
    }, root, 'run-2');

    await saveHarnessRun({
      ok: true,
      workspace: '/tmp/demo',
      task: 'ship feature',
      iterations: 1,
      lastGuidance: 'resume again',
      lastValidationStdout: 'ok',
      lastValidationStderr: '',
      validateCommand: 'npm test',
      resumedFrom: 'run-2',
      runId: 'run-3',
    }, root, 'run-3');

    await saveIterationEntry('run-1', {
      iteration: 1,
      timestamp: 't1',
      guidance: 'first try',
      filesCreated: [],
      filesModified: [],
      validationPassed: false,
      validationStdout: '',
      validationStderr: 'boom',
      criticInsight: 'Check failing assertion',
    }, root);
    await saveIterationEntry('run-2', {
      iteration: 1,
      timestamp: 't2',
      guidance: 'resume try',
      filesCreated: [],
      filesModified: [],
      validationPassed: false,
      validationStdout: '',
      validationStderr: 'boom again',
    }, root);
    await saveIterationEntry('run-3', {
      iteration: 1,
      timestamp: 't3',
      guidance: 'final try',
      filesCreated: [],
      filesModified: [],
      validationPassed: true,
      validationStdout: 'ok',
      validationStderr: '',
    }, root);

    const chain = await buildHarnessChain('run-1', root);
    expect(chain.plan?.runId).toBe('plan-1');
    expect(chain.resumes).toHaveLength(2);
    expect(chain.nodeSummaries['run-1']?.latestPassed).toBe(false);
    expect(chain.nodeSummaries['run-1']?.latestCriticInsight).toBe('Check failing assertion');
    expect(chain.nodeSummaries['run-3']?.latestPassed).toBe(true);

    const text = formatHarnessChain(chain);
    expect(text).toContain('Plan: plan-1');
    expect(text).toContain('Root iterations: 1');
    expect(text).toContain('Root latest stderr: boom');
    expect(text).toContain('Root critic: Check failing assertion');
    expect(text).toContain('- run-2 <= run-1 | iterations=1 | latestPassed=false | stderr=boom again');
    expect(text).toContain('- run-3 <= run-2 | iterations=1 | latestPassed=true | stdout=ok');

    await fs.rm(root, { recursive: true, force: true });
  });
});
