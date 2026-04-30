import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { saveHarnessRun, loadHarnessRun } from '../src/harness/store.js';

describe('harness plan storage', () => {
  it('persists a harness plan artifact', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-harness-plan-${Date.now()}`);
    const saved = await saveHarnessRun({
      kind: 'plan',
      ok: true,
      approvalStatus: 'draft',
      workspace: '/tmp/demo',
      approvalRequestId: 'appr-1',
      sourceHandoffId: 'handoff-5',
      sourceHandoffChain: ['handoff-1', 'handoff-3', 'handoff-5'],
      task: 'review before write',
      validateCommand: 'npm test',
      planText: 'Summary\n- Do the thing',
    }, root);

    const raw = await fs.readFile(saved.path, 'utf8');
    expect(raw).toContain('"kind": "plan"');
    const loaded = await loadHarnessRun(saved.runId, root);
    expect(loaded?.kind).toBe('plan');
    expect(loaded?.approvalStatus).toBe('draft');
    expect(loaded?.approvalRequestId).toBe('appr-1');
    expect(loaded?.sourceHandoffId).toBe('handoff-5');
    expect(loaded?.sourceHandoffChain).toEqual(['handoff-1', 'handoff-3', 'handoff-5']);
    await fs.rm(root, { recursive: true, force: true });
  });
});
