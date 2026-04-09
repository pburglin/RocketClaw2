import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createSession, appendMessage } from '../src/sessions/store.js';
import { buildConsolidationPlan } from '../src/memory/consolidation.js';

describe('buildConsolidationPlan', () => {
  it('selects salient session messages for promotion or summarization', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-dream-${Date.now()}`);
    const session = await createSession('Dream Test', root);
    await appendMessage(session.id, 'user', 'Important decision: remember this preference for future planning', root);
    const plan = await buildConsolidationPlan(root);
    expect(plan.length).toBeGreaterThan(0);
    expect(['promote', 'summarize']).toContain(plan[0]?.suggestedAction);
    await fs.rm(root, { recursive: true, force: true });
  });
});
