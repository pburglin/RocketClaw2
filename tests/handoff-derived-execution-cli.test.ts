import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import YAML from 'yaml';

const execFileAsync = promisify(execFile);

describe('handoff-derived execution CLI flows', () => {
  it('builds a harness plan directly from a saved handoff artifact', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-handoff-plan-home-'));
    const root = path.join(home, '.rocketclaw2');
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-handoff-plan-workspace-'));

    try {
      await fs.mkdir(path.join(root, 'handoffs'), { recursive: true });
      await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({ messaging: { whatsapp: { enabled: false, mode: 'mock' } } }));
      await fs.writeFile(path.join(workspace, 'package.json'), '{"name":"demo"}\n', 'utf8');
      await fs.writeFile(path.join(root, 'handoffs', 'handoff-123.json'), JSON.stringify({
        id: 'handoff-123',
        createdAt: '2026-04-30T10:00:00.000Z',
        activeGoal: 'Ship the staged handoff execution flow',
        environment: {
          profile: 'default',
          llmModel: 'demo-model',
          llmRetryCount: 3,
          llmApiKeyConfigured: false,
          whatsappEnabled: false,
          whatsappMode: 'mock',
          sessionCount: 0,
          messageCount: 0,
          semanticMemoryEntries: 0,
          pendingApprovals: 0,
          latestSessionUpdate: null,
        },
        handoff: {
          owner: 'implementer',
          notes: 'Apply the scoped change and preserve current validation posture.',
        },
        related: {},
        parentHandoffId: 'handoff-100',
        handoffChain: ['handoff-100'],
        constraints: ['Touch only the CLI flow.'],
        risks: ['Could break harness approval UX.'],
        nextActions: ['Run focused tests before merge.'],
        source: {
          worldModelCommand: 'rocketclaw2 world-model',
          workspaceStatusCommand: 'rocketclaw2 workspace-status',
          systemSummaryCommand: 'rocketclaw2 system-summary',
        },
      }, null, 2));

      const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
        'src/cli.ts',
        '--llm-mode', 'mock',
        'harness-plan',
        '--workspace', workspace,
        '--from-handoff-id', 'handoff-123',
        '--validate', 'npm test',
        '--json',
      ], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          HOME: home,
          RC2_MOCK_LLM_INITIAL_DELAY_MS: '0',
          RC2_MOCK_LLM_CHUNK_DELAY_MS: '0',
          RC2_MOCK_LLM_CHUNK_SIZE: '12',
        },
      });

      const report = JSON.parse(stdout);
      expect(report.task).toContain('Continue work from handoff artifact handoff-123.');
      expect(report.task).toContain('Current owner/stage: implementer');
      expect(report.task).toContain('Prior handoff lineage: handoff-100 -> handoff-123');
      expect(report.sourceHandoffId).toBe('handoff-123');
      expect(report.sourceHandoffChain).toEqual(['handoff-100', 'handoff-123']);
    } finally {
      await fs.rm(home, { recursive: true, force: true });
      await fs.rm(workspace, { recursive: true, force: true });
    }
  }, 20000);

  it('lets auto-code derive and persist a plan from a saved handoff before manual approval', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-handoff-auto-code-home-'));
    const root = path.join(home, '.rocketclaw2');
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-handoff-auto-code-workspace-'));

    try {
      await fs.mkdir(path.join(root, 'handoffs'), { recursive: true });
      await fs.writeFile(path.join(root, 'config.yaml'), YAML.stringify({ messaging: { whatsapp: { enabled: false, mode: 'mock' } } }));
      await fs.writeFile(path.join(workspace, 'package.json'), '{"name":"demo"}\n', 'utf8');
      await fs.writeFile(path.join(root, 'handoffs', 'handoff-456.json'), JSON.stringify({
        id: 'handoff-456',
        createdAt: '2026-04-30T10:15:00.000Z',
        activeGoal: 'Ship the staged handoff execution flow',
        environment: {
          profile: 'default',
          llmModel: 'demo-model',
          llmRetryCount: 3,
          llmApiKeyConfigured: false,
          whatsappEnabled: false,
          whatsappMode: 'mock',
          sessionCount: 0,
          messageCount: 0,
          semanticMemoryEntries: 0,
          pendingApprovals: 0,
          latestSessionUpdate: null,
        },
        handoff: {
          owner: 'implementer',
          notes: 'Apply the scoped change and preserve current validation posture.',
        },
        related: {},
        parentHandoffId: 'handoff-400',
        handoffChain: ['handoff-400'],
        constraints: ['Touch only the CLI flow.'],
        risks: ['Could break harness approval UX.'],
        nextActions: ['Run focused tests before merge.'],
        source: {
          worldModelCommand: 'rocketclaw2 world-model',
          workspaceStatusCommand: 'rocketclaw2 workspace-status',
          systemSummaryCommand: 'rocketclaw2 system-summary',
        },
      }, null, 2));

      const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
        'src/cli.ts',
        '--llm-mode', 'mock',
        'auto-code',
        '--workspace', workspace,
        '--from-handoff-id', 'handoff-456',
        '--validate', 'npm test',
        '--no-auto-approve',
        '--json',
      ], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          HOME: home,
          RC2_MOCK_LLM_INITIAL_DELAY_MS: '0',
          RC2_MOCK_LLM_CHUNK_DELAY_MS: '0',
          RC2_MOCK_LLM_CHUNK_SIZE: '12',
        },
      });

      const report = JSON.parse(stdout);
      expect(report.ok).toBe(false);
      expect(report.approvalRequired).toBe(true);
      expect(typeof report.planId).toBe('string');
      expect(report.planId.length).toBeGreaterThan(0);
      expect(report.nextSteps).toEqual([
        `rocketclaw2 harness-show --id ${report.planId} --plan`,
        `rocketclaw2 harness-approve --id ${report.planId}`,
        `rocketclaw2 harness-run --id ${report.planId} --require-approved-plan`,
      ]);

      const artifact = JSON.parse(await fs.readFile(path.join(root, 'harness-runs', `${report.planId}.json`), 'utf8'));
      expect(artifact.task).toContain('Continue work from handoff artifact handoff-456.');
      expect(artifact.sourceHandoffId).toBe('handoff-456');
      expect(artifact.sourceHandoffChain).toEqual(['handoff-400', 'handoff-456']);
    } finally {
      await fs.rm(home, { recursive: true, force: true });
      await fs.rm(workspace, { recursive: true, force: true });
    }
  }, 20000);
});
