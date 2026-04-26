import { describe, expect, it, vi, beforeEach } from 'vitest';

const buildHarnessPlanMock = vi.fn();
const runCodingHarnessFromPlanMock = vi.fn();
const resumeCodingHarnessRunMock = vi.fn();
const saveHarnessRunMock = vi.fn();
const approveHarnessPlanMock = vi.fn();
const findLatestHarnessArtifactMock = vi.fn();

vi.mock('../src/harness/coding-harness.js', () => ({
  buildHarnessPlan: buildHarnessPlanMock,
  runCodingHarnessFromPlan: runCodingHarnessFromPlanMock,
  resumeCodingHarnessRun: resumeCodingHarnessRunMock,
}));

vi.mock('../src/harness/store.js', () => ({
  saveHarnessRun: saveHarnessRunMock,
  approveHarnessPlan: approveHarnessPlanMock,
  findLatestHarnessArtifact: findLatestHarnessArtifactMock,
}));

vi.mock('../src/harness/formatters.js', () => ({
  formatCodingHarnessResult: (result: { iterations?: number }) => `iterations=${result.iterations ?? 'n/a'}`,
}));

describe('runAutoCode', () => {
  beforeEach(() => {
    buildHarnessPlanMock.mockReset();
    runCodingHarnessFromPlanMock.mockReset();
    resumeCodingHarnessRunMock.mockReset();
    saveHarnessRunMock.mockReset();
    approveHarnessPlanMock.mockReset();
    findLatestHarnessArtifactMock.mockReset();
    findLatestHarnessArtifactMock.mockResolvedValue(null);
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
    expect(result.planId).toBe('plan-123');
    expect(result.artifactPath).toBe('/tmp/plan-123.json');
    expect(runCodingHarnessFromPlanMock).toHaveBeenCalledWith({} as any, 'plan-123', expect.objectContaining({ maxIterations: 3 }));
  });

  it('resumes an incomplete run for the same workspace and task before rebuilding a plan', async () => {
    findLatestHarnessArtifactMock
      .mockResolvedValueOnce({ runId: 'run-123', workspace: '/tmp/demo', task: 'demo', ok: false })
      .mockResolvedValueOnce(null);
    resumeCodingHarnessRunMock.mockResolvedValue({
      ok: true,
      iterations: 2,
      workspace: '/tmp/demo',
      task: 'demo',
      validateCommand: 'npm test',
      lastGuidance: '',
      lastValidationStdout: 'ok',
      lastValidationStderr: '',
      artifactPath: '/tmp/run-123.json',
      resumedFrom: 'run-123',
    });

    const { runAutoCode } = await import('../src/commands/auto-code.js');
    const result = await runAutoCode({} as any, '/tmp/demo', 'demo', 'npm test', 5, true);

    expect(result.ok).toBe(true);
    expect(result.result).toContain('resumed successfully');
    expect(result.artifactPath).toBe('/tmp/run-123.json');
    expect(buildHarnessPlanMock).not.toHaveBeenCalled();
    expect(resumeCodingHarnessRunMock).toHaveBeenCalledWith({} as any, 'run-123', expect.objectContaining({ maxIterations: 5 }));
  });

  it('reuses an approved saved plan before rebuilding a fresh one', async () => {
    findLatestHarnessArtifactMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ runId: 'plan-999', kind: 'plan', approvalStatus: 'approved', workspace: '/tmp/demo', task: 'demo' });
    runCodingHarnessFromPlanMock.mockResolvedValue({
      ok: true,
      iterations: 1,
      validateCommand: 'npm test',
      lastGuidance: '',
      lastValidationStdout: 'ok',
      lastValidationStderr: '',
      executedPlanId: 'plan-999',
      artifactPath: '/tmp/run-from-plan.json',
      workspace: '/tmp/demo',
      task: 'demo',
    });

    const { runAutoCode } = await import('../src/commands/auto-code.js');
    const result = await runAutoCode({} as any, '/tmp/demo', 'demo', 'npm test', 3, true);

    expect(result.ok).toBe(true);
    expect(result.planId).toBe('plan-999');
    expect(result.result).toContain('resumed from approved plan');
    expect(buildHarnessPlanMock).not.toHaveBeenCalled();
    expect(runCodingHarnessFromPlanMock).toHaveBeenCalledWith({} as any, 'plan-999', expect.objectContaining({ maxIterations: 3 }));
  });

  it('returns explicit next steps when auto-approve is disabled', async () => {
    buildHarnessPlanMock.mockResolvedValue({
      kind: 'plan',
      ok: true,
      approvalStatus: 'draft',
      workspace: '/tmp/demo',
      task: 'demo',
      validateCommand: 'npm test',
      planText: 'Summary',
    });
    saveHarnessRunMock.mockResolvedValue({ runId: 'plan-456', path: '/tmp/plan-456.json' });

    const { runAutoCode } = await import('../src/commands/auto-code.js');
    const result = await runAutoCode({} as any, '/tmp/demo', 'demo', 'npm test', 3, false);

    expect(result.ok).toBe(false);
    expect(result.approvalRequired).toBe(true);
    expect(result.planId).toBe('plan-456');
    expect(result.artifactPath).toBe('/tmp/plan-456.json');
    expect(result.nextSteps).toEqual([
      'rocketclaw2 harness-show --id plan-456 --plan',
      'rocketclaw2 harness-approve --id plan-456',
      'rocketclaw2 harness-run --id plan-456 --require-approved-plan',
    ]);
    expect(approveHarnessPlanMock).not.toHaveBeenCalled();
    expect(runCodingHarnessFromPlanMock).not.toHaveBeenCalled();
  });

  it('returns LLM recovery steps when planning fails with an LLM/provider error', async () => {
    buildHarnessPlanMock.mockRejectedValue(new Error('LLM provider timed out (code: 524). Provider returned error'));

    const { runAutoCode } = await import('../src/commands/auto-code.js');
    const result = await runAutoCode({ llm: { baseUrl: 'https://example.com/v1', model: 'demo-model' } } as any, '/tmp/demo', 'demo', 'npm test', 3, true);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Autonomous coding failed: LLM provider timed out');
    expect(result.nextSteps).toEqual([
      'rocketclaw2 --llm-base-url "https://example.com/v1" --llm-api-key "$API_KEY" --llm-model "demo-model" llm-status',
      'rocketclaw2 --llm-base-url "https://example.com/v1" --llm-api-key "$API_KEY" --llm-model "demo-model" llm-query --prompt "Reply with exactly: LLM_OK"',
      'rocketclaw2 --llm-base-url "https://example.com/v1" --llm-api-key "$API_KEY" --llm-model "gpt-4o-mini" llm-query --prompt "Reply with exactly: LLM_OK"',
      'If llm-status still says the API key is missing, confirm your shell expanded $API_KEY before rerunning the command.',
    ]);
  });

  it('emits progress events for planning and execution flow', async () => {
    const events: Array<{ stage: string; message: string; iteration?: number }> = [];
    buildHarnessPlanMock.mockResolvedValue({
      kind: 'plan',
      ok: true,
      approvalStatus: 'draft',
      workspace: '/tmp/demo',
      task: 'demo',
      validateCommand: 'npm test',
      planText: 'Summary',
    });
    saveHarnessRunMock.mockResolvedValue({ runId: 'plan-789', path: '/tmp/plan-789.json' });
    approveHarnessPlanMock.mockResolvedValue({ approvalStatus: 'approved' });
    runCodingHarnessFromPlanMock.mockImplementation(async (_config: unknown, _planId: string, options: { onProgress?: (event: { stage: string; message: string; iteration?: number }) => void }) => {
      options.onProgress?.({ iteration: 1, stage: 'llm-request', message: 'Requesting implementation guidance from the model' });
      options.onProgress?.({ iteration: 1, stage: 'llm-response', message: 'Received implementation guidance from the model' });
      return {
        ok: true,
        iterations: 1,
        validateCommand: 'npm test',
        lastGuidance: '',
        lastValidationStdout: 'ok',
        lastValidationStderr: '',
        executedPlanId: 'plan-789',
        workspace: '/tmp/demo',
        task: 'demo',
      };
    });

    const { runAutoCode } = await import('../src/commands/auto-code.js');
    const result = await runAutoCode({} as any, '/tmp/demo', 'demo', 'npm test', 1, true, (event) => events.push(event));

    expect(result.ok).toBe(true);
    expect(events.some((event) => event.stage === 'planning-start')).toBe(true);
    expect(events.some((event) => event.stage === 'plan-approved')).toBe(true);
    expect(events.some((event) => event.stage === 'llm-request')).toBe(true);
    expect(events.some((event) => event.stage === 'execution-complete')).toBe(true);
  });

  it('passes LLM token callbacks through planning and execution helpers', async () => {
    const streamed: string[] = [];
    buildHarnessPlanMock.mockImplementation(async (_config: unknown, _input: unknown, _onTrace: unknown, _onProgress: unknown, onToken?: (chunk: string, label?: string) => void) => {
      onToken?.('plan chunk', 'plan generation');
      return {
        kind: 'plan',
        ok: true,
        approvalStatus: 'draft',
        workspace: '/tmp/demo',
        task: 'demo',
        validateCommand: 'npm test',
        planText: 'Summary',
      };
    });
    saveHarnessRunMock.mockResolvedValue({ runId: 'plan-stream', path: '/tmp/plan-stream.json' });
    approveHarnessPlanMock.mockResolvedValue({ approvalStatus: 'approved' });
    runCodingHarnessFromPlanMock.mockImplementation(async (_config: unknown, _planId: string, options: { onLlmToken?: (chunk: string, label?: string) => void }) => {
      options.onLlmToken?.('execution chunk', 'implementation guidance (iteration 1)');
      return {
        ok: true,
        iterations: 1,
        validateCommand: 'npm test',
        lastGuidance: '',
        lastValidationStdout: 'ok',
        lastValidationStderr: '',
        executedPlanId: 'plan-stream',
        workspace: '/tmp/demo',
        task: 'demo',
      };
    });

    const { runAutoCode } = await import('../src/commands/auto-code.js');
    const result = await runAutoCode({} as any, '/tmp/demo', 'demo', 'npm test', 1, true, undefined, undefined, (chunk) => streamed.push(chunk));

    expect(result.ok).toBe(true);
    expect(streamed).toEqual(['plan chunk', 'execution chunk']);
  });
});
