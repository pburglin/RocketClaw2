import type { HandoffArtifact } from '../handoff/store.js';
import { saveHandoffArtifact } from '../handoff/store.js';
import { buildRoleTemplate, buildRoleTemplateFromHandoff, type TeamRoleName } from './role-templates.js';

export type TeamWorkflowStage = {
  role: TeamRoleName;
  owner: string;
  template: ReturnType<typeof buildRoleTemplate>;
  handoffPreset: string;
  suggestedCommand: string;
};

export type TeamWorkflow = {
  goal: string;
  stages: TeamWorkflowStage[];
  reviewCheckpoint: string;
  finalCheckpoint: string;
};

export type SavedTeamWorkflowStage = {
  role: TeamRoleName;
  handoffId: string;
  owner: string;
  parentHandoffId?: string;
  chainDepth: number;
};

const DEFAULT_ROLE_ORDER: TeamRoleName[] = ['pm', 'architect', 'implementer', 'reviewer'];

function defaultScope(role: TeamRoleName): string {
  if (role === 'pm') return 'Clarify scope, acceptance criteria, and priorities only.';
  if (role === 'architect') return 'Design the implementation approach, interfaces, and risks only.';
  if (role === 'implementer') return 'Make the scoped change and report validation evidence only.';
  return 'Validate against acceptance criteria and surface regressions or release risks only.';
}

function defaultDeliverable(role: TeamRoleName): string | undefined {
  if (role === 'pm') return 'Acceptance criteria, priorities, and open product questions.';
  if (role === 'architect') return 'Technical approach, interfaces, risks, and rollout notes.';
  if (role === 'implementer') return 'Scoped implementation plus validation notes.';
  return 'Approve/revise/block recommendation with concrete evidence.';
}

function buildSuggestedCommand(stage: TeamWorkflowStage): string {
  return `rocketclaw2 handoff-create --preset ${stage.handoffPreset} --owner ${stage.owner} --notes "${stage.template.brief.split('\n').slice(0, 2).join(' | ').replace(/"/g, '\\"')}"`;
}

export function buildTeamWorkflow(input: {
  goal: string;
  inputs?: string[];
  handoff?: HandoffArtifact;
}): TeamWorkflow {
  const stages = DEFAULT_ROLE_ORDER.map((role) => {
    const template = input.handoff
      ? buildRoleTemplateFromHandoff({
          role,
          handoff: input.handoff,
          scope: defaultScope(role),
          deliverable: defaultDeliverable(role),
          extraInputs: input.inputs,
        })
      : buildRoleTemplate({
          role,
          goal: input.goal,
          scope: defaultScope(role),
          deliverable: defaultDeliverable(role),
          inputs: input.inputs,
        });

    const stage: TeamWorkflowStage = {
      role,
      owner: role,
      template,
      handoffPreset: role,
      suggestedCommand: '',
    };
    stage.suggestedCommand = buildSuggestedCommand(stage);
    return stage;
  });

  return {
    goal: input.handoff?.activeGoal ?? input.goal,
    stages,
    reviewCheckpoint: 'Run reviewer/QA validation before final acceptance or merge.',
    finalCheckpoint: 'Capture open risks, next actions, and any follow-up handoff artifacts.',
  };
}

export async function saveTeamWorkflowHandoffs(input: {
  workflow: TeamWorkflow;
  seed: Pick<HandoffArtifact, 'activeGoal' | 'environment' | 'related' | 'constraints' | 'risks' | 'nextActions' | 'source'>;
  root?: string;
}): Promise<SavedTeamWorkflowStage[]> {
  const saved: SavedTeamWorkflowStage[] = [];
  let previousHandoffId: string | undefined;

  for (const stage of input.workflow.stages) {
    const artifact = await saveHandoffArtifact({
      activeGoal: input.workflow.goal,
      environment: input.seed.environment,
      related: input.seed.related,
      constraints: input.seed.constraints,
      risks: input.seed.risks,
      nextActions: input.seed.nextActions,
      source: input.seed.source,
      ...(previousHandoffId ? { parentHandoffId: previousHandoffId } : {}),
      handoff: {
        owner: stage.owner,
        notes: stage.template.brief,
      },
    }, input.root);

    saved.push({
      role: stage.role,
      handoffId: artifact.id,
      owner: stage.owner,
      parentHandoffId: artifact.parentHandoffId,
      chainDepth: artifact.handoffChain.length,
    });
    previousHandoffId = artifact.id;
  }

  return saved;
}

export function formatTeamWorkflow(workflow: TeamWorkflow, savedStages?: SavedTeamWorkflowStage[]): string {
  const savedByRole = new Map(savedStages?.map((stage) => [stage.role, stage]) ?? []);
  return [
    'RocketClaw2 Multi-Agent Team Workflow',
    `Goal: ${workflow.goal}`,
    'Stages:',
    ...workflow.stages.flatMap((stage, index) => {
      const saved = savedByRole.get(stage.role);
      return [
        `${index + 1}. ${stage.role.toUpperCase()} (${stage.owner})`,
        `   Brief: ${stage.template.brief.replace(/\n/g, ' | ')}`,
        `   Checklist: ${stage.template.checklist.join(' | ')}`,
        `   Suggested handoff: ${stage.suggestedCommand}`,
        saved
          ? `   Saved handoff: ${saved.handoffId}${saved.parentHandoffId ? ` | parent=${saved.parentHandoffId} | depth=${saved.chainDepth}` : ''}`
          : null,
      ].filter(Boolean) as string[];
    }),
    `Review checkpoint: ${workflow.reviewCheckpoint}`,
    `Final checkpoint: ${workflow.finalCheckpoint}`,
  ].join('\n');
}
