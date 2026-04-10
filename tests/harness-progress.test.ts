import { describe, expect, it, vi } from 'vitest';
import { runCodingHarness } from '../src/harness/coding-harness.js';

describe('harness progress reporting', () => {
  it('emits progress milestones during an iteration', async () => {
    const events: Array<{ iteration: number; stage: string; message: string }> = [];
    try {
      await runCodingHarness({} as any, {
        workspace: '/tmp/rc2-progress-test',
        task: 'demo',
        validateCommand: 'echo ok',
        maxIterations: 1,
      }, (event) => events.push(event));
    } catch {
      // LLM likely fails without config in unit context, but early progress should still exist
    }
    expect(events.some((e) => e.stage === 'iteration-start')).toBe(true);
    expect(events.some((e) => e.stage === 'llm-request')).toBe(true);
  });
});
