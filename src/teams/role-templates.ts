import type { HandoffArtifact } from '../handoff/store.js';

export type TeamRoleName = 'pm' | 'architect' | 'implementer' | 'reviewer';

export function normalizeTeamRole(role: string): TeamRoleName {
  if (role === 'pm' || role === 'architect' || role === 'implementer' || role === 'reviewer' || role === 'qa') {
    return role === 'qa' ? 'reviewer' : role;
  }
  throw new Error(`Unknown team role: ${role}. Use one of: pm, architect, implementer, reviewer, qa`);
}

export function buildRoleTemplate(input: {
  role: TeamRoleName;
  goal: string;
  scope?: string;
  inputs?: string[];
  deliverable?: string;
}): { role: TeamRoleName; brief: string; checklist: string[] } {
  const scope = input.scope?.trim() || 'Keep scope narrow and explicit.';
  const inputs = input.inputs && input.inputs.length > 0 ? input.inputs : ['Use only the provided task context and artifacts.'];

  if (input.role === 'pm') {
    return {
      role: 'pm',
      brief: `Role: PM\nGoal: ${input.goal}\nScope: ${scope}\nDeliverable: ${input.deliverable || 'Acceptance criteria, priorities, and open product questions.'}`,
      checklist: [
        'Clarify objective and desired outcome.',
        'Define acceptance criteria and constraints.',
        'Call out open product risks or ambiguities.',
        `Inputs: ${inputs.join('; ')}`,
      ],
    };
  }

  if (input.role === 'architect') {
    return {
      role: 'architect',
      brief: `Role: Architect\nGoal: ${input.goal}\nScope: ${scope}\nDeliverable: ${input.deliverable || 'Technical approach, interfaces, risks, and rollout notes.'}`,
      checklist: [
        'Describe the implementation approach and key boundaries.',
        'Identify interfaces, dependencies, and migration concerns.',
        'Highlight risks, tradeoffs, and validation needs.',
        `Inputs: ${inputs.join('; ')}`,
      ],
    };
  }

  if (input.role === 'implementer') {
    return {
      role: 'implementer',
      brief: `Role: Implementer\nGoal: ${input.goal}\nScope: ${scope}\nDeliverable: ${input.deliverable || 'Scoped code or docs change plus validation notes.'}`,
      checklist: [
        'Make only the scoped change.',
        'Preserve existing behavior unless the task requires otherwise.',
        'Report blockers, assumptions, and validation evidence.',
        `Inputs: ${inputs.join('; ')}`,
      ],
    };
  }

  return {
    role: 'reviewer',
    brief: `Role: Reviewer/QA\nGoal: ${input.goal}\nScope: ${scope}\nDeliverable: ${input.deliverable || 'Validation result, regressions, and release risks.'}`,
    checklist: [
      'Validate against acceptance criteria.',
      'Look for regressions, missing coverage, and unresolved risks.',
      'Recommend approve, revise, or block with reasons.',
      `Inputs: ${inputs.join('; ')}`,
    ],
  };
}

export function buildRoleTemplateFromHandoff(input: {
  role: TeamRoleName;
  handoff: HandoffArtifact;
  scope?: string;
  deliverable?: string;
  extraInputs?: string[];
}): { role: TeamRoleName; brief: string; checklist: string[] } {
  const handoff = input.handoff;
  const derivedScope = input.scope?.trim()
    || (handoff.constraints.length > 0
      ? `Honor these constraints: ${handoff.constraints.join('; ')}`
      : 'Keep scope narrow and explicit.');

  const derivedInputs = [
    `Handoff artifact ${handoff.id}`,
    `Active goal: ${handoff.activeGoal}`,
    ...(handoff.handoff.notes ? [`Handoff notes: ${handoff.handoff.notes}`] : []),
    ...(handoff.related.harness ? [`Related harness: ${handoff.related.harness.runId}`] : []),
    ...(handoff.related.approval ? [`Related approval: ${handoff.related.approval.id}`] : []),
    ...handoff.nextActions.slice(0, 2).map((item) => `Next action hint: ${item}`),
    ...(input.extraInputs ?? []),
  ];

  return buildRoleTemplate({
    role: input.role,
    goal: handoff.activeGoal,
    scope: derivedScope,
    inputs: derivedInputs,
    deliverable: input.deliverable,
  });
}

export function formatRoleTemplate(template: ReturnType<typeof buildRoleTemplate>): string {
  return [
    'RocketClaw2 Team Role Template',
    template.brief,
    'Checklist:',
    ...template.checklist.map((item) => `- ${item}`),
  ].join('\n');
}
