import { describe, expect, it } from 'vitest';
import { buildTeamWorkflow, formatTeamWorkflow } from '../src/teams/orchestrator.js';

describe('team orchestrator', () => {
  it('builds a staged workflow for the default role sequence', () => {
    const workflow = buildTeamWorkflow({
      goal: 'Ship a scoped runtime ergonomics improvement',
      inputs: ['README.md', 'docs/USAGE.md'],
    });

    expect(workflow.stages).toHaveLength(4);
    expect(workflow.stages[0]?.role).toBe('pm');
    expect(workflow.stages[3]?.role).toBe('reviewer');
    expect(workflow.stages[1]?.suggestedCommand).toContain('handoff-create --preset architect');

    const text = formatTeamWorkflow(workflow, [{ role: 'pm', handoffId: 'handoff-1', owner: 'pm', chainDepth: 0 }]);
    expect(text).toContain('RocketClaw2 Multi-Agent Team Workflow');
    expect(text).toContain('Saved handoff: handoff-1');
    expect(text).toContain('Review checkpoint:');
  });
});
