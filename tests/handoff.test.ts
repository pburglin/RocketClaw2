import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApprovalRequest } from '../src/approval/store.js';
import { loadConfig } from '../src/config/load-config.js';
import { saveHarnessRun } from '../src/harness/store.js';
import { createHandoffArtifact } from '../src/handoff/runtime.js';
import { formatHandoffArtifact, formatHandoffList, getHandoffFollowUpCommands } from '../src/handoff/formatters.js';
import { listHandoffArtifacts, loadHandoffArtifact } from '../src/handoff/store.js';

describe('handoff artifacts', () => {
  it('creates, stores, and formats a world-model handoff artifact', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-handoff-'));
    const config = loadConfig({ llm: { model: 'demo-model', retryCount: 4 } });

    await saveHarnessRun({
      runId: 'plan-123',
      kind: 'plan',
      ok: true,
      approvalStatus: 'approved',
      workspace: '/tmp/demo',
      task: 'Demo task',
      validateCommand: 'npm test',
      planText: 'demo plan',
      guidance: 'demo guidance',
      validationPassed: true,
      validationStdout: '',
      validationStderr: '',
      iterations: [],
    } as any, root, 'plan-123');
    const approval = await createApprovalRequest({
      kind: 'harness-plan',
      target: 'plan-123',
      detail: 'Review demo plan',
    }, root);

    const artifact = await createHandoffArtifact(config, root, {
      owner: 'qa-engineer',
      notes: 'Focus on final verification before handoff.',
      relatedHarnessId: 'plan-123',
      relatedApprovalId: approval.id,
    });
    const loaded = await loadHandoffArtifact(artifact.id, root);
    const listed = await listHandoffArtifacts(root);

    expect(artifact.environment.llmRetryCount).toBe(4);
    expect(artifact.handoff.owner).toBe('qa-engineer');
    expect(artifact.related.harness?.runId).toBe('plan-123');
    expect(artifact.related.approval?.id).toBe(approval.id);
    expect(loaded?.id).toBe(artifact.id);
    expect(listed).toHaveLength(1);
    expect(formatHandoffArtifact(artifact)).toContain('RocketClaw2 Handoff Artifact');
    expect(formatHandoffArtifact(artifact)).toContain('Owner: qa-engineer');
    expect(formatHandoffArtifact(artifact)).toContain('Related harness: plan-123');
    expect(formatHandoffArtifact(artifact)).toContain('Suggested follow-up commands:');
    expect(formatHandoffArtifact(artifact)).toContain('rocketclaw2 approval-pending');
    expect(formatHandoffArtifact(artifact)).toContain('retryCount=4');
    expect(getHandoffFollowUpCommands(artifact)).toContain('rocketclaw2 approval-pending');
    expect(formatHandoffList(listed)).toContain('owner=qa-engineer');

    await fs.rm(root, { recursive: true, force: true });
  });
});
