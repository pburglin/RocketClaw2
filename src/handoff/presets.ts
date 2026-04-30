export type HandoffPresetName = 'pm' | 'architect' | 'implementer' | 'qa' | 'reviewer';

export function resolveHandoffPreset(
  preset: string | undefined,
): { owner?: string; notes?: string } {
  if (!preset) return {};
  if (preset === 'pm') {
    return {
      owner: 'pm',
      notes: 'Clarify scope, acceptance criteria, priorities, and open product questions before implementation.',
    };
  }
  if (preset === 'architect') {
    return {
      owner: 'architect',
      notes: 'Define technical approach, interfaces, constraints, risks, and rollout considerations before coding.',
    };
  }
  if (preset === 'implementer') {
    return {
      owner: 'implementer',
      notes: 'Execute the scoped change, keep edits bounded, and surface blockers or unclear requirements quickly.',
    };
  }
  if (preset === 'qa' || preset === 'reviewer') {
    return {
      owner: preset,
      notes: 'Validate against acceptance criteria, inspect regressions, and report concrete failures or release risks.',
    };
  }
  throw new Error(`Unknown handoff preset: ${preset}. Use one of: pm, architect, implementer, reviewer, qa`);
}
