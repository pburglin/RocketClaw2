import { describe, expect, it, vi, beforeEach } from 'vitest';

const buildHarnessPlanMock = vi.fn();
const runCodingHarnessFromPlanMock = vi.fn();
const saveHarnessRunMock = vi.fn();
const approveHarnessPlanMock = vi.fn();

vi.mock('../src/harness/coding-harness.js', () => ({
  buildHarnessPlan: buildHarnessPlanMock,
  runCodingHarnessFromPlan: runCodingHarnessFromPlanMock,
}));

vi.mock('../src/harness/store.js', () => ({
  saveHarnessRun: saveHarnessRunMock,
  approveHarnessPlan: approveHarnessPlanMock,
}));

vi.mock('../src/harness/formatters.js', () => ({
  formatCodingHarnessResult: (result: { iterations?: number }) => `iterations=${result.iterations ?? 'n/a'}`,
}));

describe('runAutoCode', () => {
  beforeEach(() => {
    buildHarnessPlanMock.mockReset();
    runCodingHarnessFromPlanMock.mockReset();
    saveHarnessRunMock.mockReset();
    approveHarnessPlanMock.mockReset();
  });

  it('passes maxIterations through the approved-plan execution path', async () => {
    buildHarnessPlanMock.mockResolvedValue({
      kind: 'plan',
      ok: true,
      approvalStatus: 'draft',
      workspace: '/tmp/demo',
      task: 'demo',
      validateCommand: 'npm test',
      planText: 'Summary',
    });
    saveHarnessRunMock.mockResolvedValue({ runId: 'plan-123', path: '/tmp/plan-123.json' });
    approveHarnessPlanMock.mockResolvedValue({ approvalStatus: 'approved' });
    runCodingHarnessFromPlanMock.mockResolvedValue({
      ok: true,
      iterations: 3,
      validateCommand: 'npm test',
      lastGuidance: '',
      lastValidationStdout: 'ok',
      lastValidationStderr: '',
      executedPlanId: 'plan-123',
      workspace: '/tmp/demo',
      task: 'demo',
    });

    const { runAutoCode } = await import('../src/commands/auto-code.js');
    const result = await runAutoCode({} as any, '/tmp/demo', 'demo', 'npm test', 3, true);

    expect(result.ok).toBe(true);
    expect(runCodingHarnessFromPlanMock).toHaveBeenCalledWith({} as any, 'plan-123', { maxIterations: 3 });
  });
});
