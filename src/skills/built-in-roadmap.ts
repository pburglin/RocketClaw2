export type BuiltInSkillId =
  | 'ralph-loop'
  | 'karpathian-loop'
  | 'world-model'
  | 'second-brain'
  | 'multi-agent-teams'
  | 'evaluator-optimizer';

export type BuiltInSkillRoadmapItem = {
  id: BuiltInSkillId;
  title: string;
  purpose: string;
  runtimeSupport: string;
  roadmapDoc: string;
  demoCoverage: string;
  suggestedNextStep: string;
};

export type BuiltInSkillsRoadmap = {
  goals: string[];
  skills: BuiltInSkillRoadmapItem[];
  recommendedImplementationOrder: string[];
  operatorCadence: string[];
};

const BUILT_IN_SKILLS: BuiltInSkillRoadmapItem[] = [
  {
    id: 'ralph-loop',
    title: 'Ralph Loop',
    purpose: 'verify-and-fix loops for code, configs, and operator tasks',
    runtimeSupport: 'available now',
    roadmapDoc: 'docs/skills-roadmap/RALPH-LOOP.md',
    demoCoverage: 'yes',
    suggestedNextStep: 'Add richer presets and operator-friendly reporting around common validation workflows.',
  },
  {
    id: 'karpathian-loop',
    title: 'Karpathian Loop',
    purpose: 'metric-driven iterative self-improvement based on observed outcomes',
    runtimeSupport: 'first-class scorecard plus supporting signals (telemetry, doctor, next-actions, harness history)',
    roadmapDoc: 'docs/skills-roadmap/KARPATHIAN-LOOP.md',
    demoCoverage: 'yes (roadmap demo)',
    suggestedNextStep: 'Add persistent baselines, explicit operator-written scorecards, and richer trend history.',
  },
  {
    id: 'world-model',
    title: 'World Model',
    purpose: 'maintain a structured model of user context, environment, constraints, and task state',
    runtimeSupport: 'partial building blocks plus persisted handoff artifacts and world-model inspection commands',
    roadmapDoc: 'docs/skills-roadmap/WORLD-MODEL.md',
    demoCoverage: 'yes (roadmap demo)',
    suggestedNextStep: 'Add richer delegation templates and multi-hop orchestration flows on top of current handoff support.',
  },
  {
    id: 'second-brain',
    title: 'Second Brain',
    purpose: 'personal data ingestion, retrieval, summarization, and memory curation',
    runtimeSupport: 'available now across session memory, dreaming, promotion, and recall',
    roadmapDoc: 'docs/skills-roadmap/SECOND-BRAIN.md',
    demoCoverage: 'yes',
    suggestedNextStep: 'Add more guided onboarding so this feels like a product flow instead of a loose command set.',
  },
  {
    id: 'multi-agent-teams',
    title: 'Multi-Agent Teams',
    purpose: 'coordinate specialized sub-agents with scoped roles and review loops',
    runtimeSupport: 'first-class staged workflow helper plus chained per-stage handoff persistence, role templates, plans, approvals, and harness inspection',
    roadmapDoc: 'docs/skills-roadmap/MULTI-AGENT-TEAMS.md',
    demoCoverage: 'yes (roadmap demo)',
    suggestedNextStep: 'Tighten linkage between staged orchestration, saved handoffs, and execution artifacts so later execution can consume the emitted chain directly.',
  },
  {
    id: 'evaluator-optimizer',
    title: 'Evaluator-Optimizer',
    purpose: 'pair generation with critique and refinement',
    runtimeSupport: 'first-class evaluator summary plus supporting harness/critic/review loops',
    roadmapDoc: 'docs/skills-roadmap/EVALUATOR-OPTIMIZER.md',
    demoCoverage: 'yes',
    suggestedNextStep: 'Add richer scoring models and stronger operator review semantics beyond the current heuristic criteria checks and persisted decisions.',
  },
];

const RECOMMENDED_IMPLEMENTATION_ORDER = [
  'Ralph Loop',
  'Second Brain',
  'Evaluator-Optimizer',
  'Multi-Agent Teams',
  'World Model',
  'Karpathian Loop',
];

const OPERATOR_CADENCE = [
  'daily: World Model + Karpathian Loop to choose the next highest-value fix',
  'per change: Multi-Agent Teams + Evaluator-Optimizer for scoped execution and review',
  'before merge/release: Ralph Loop for validation',
  'periodically: Second Brain to retain lessons and prevent repeated mistakes',
];

export function getBuiltInSkillsRoadmap(): BuiltInSkillsRoadmap {
  return {
    goals: [
      'Make advanced autonomy patterns usable without custom prompt engineering.',
      'Provide opinionated setup guidance and safe defaults.',
      'Teach operators when to use each pattern and when not to.',
      'Bundle demos so new users can try each pattern quickly.',
    ],
    skills: BUILT_IN_SKILLS,
    recommendedImplementationOrder: RECOMMENDED_IMPLEMENTATION_ORDER,
    operatorCadence: OPERATOR_CADENCE,
  };
}

export function findBuiltInSkill(id: string): BuiltInSkillRoadmapItem | undefined {
  return BUILT_IN_SKILLS.find((skill) => skill.id === id);
}

export function formatBuiltInSkillsRoadmap(roadmap: BuiltInSkillsRoadmap, skill?: BuiltInSkillRoadmapItem): string {
  const skills = skill ? [skill] : roadmap.skills;
  return [
    'RocketClaw2 Built-in Skills',
    'Goals:',
    ...roadmap.goals.map((goal) => `- ${goal}`),
    'Skills:',
    ...skills.flatMap((item) => [
      `- ${item.title} (${item.id})`,
      `  Purpose: ${item.purpose}`,
      `  Runtime support: ${item.runtimeSupport}`,
      `  Roadmap doc: ${item.roadmapDoc}`,
      `  Demo coverage: ${item.demoCoverage}`,
      `  Suggested next step: ${item.suggestedNextStep}`,
    ]),
    ...(skill
      ? []
      : [
          'Recommended implementation order:',
          ...roadmap.recommendedImplementationOrder.map((item, index) => `${index + 1}. ${item}`),
          'Operator cadence:',
          ...roadmap.operatorCadence.map((item) => `- ${item}`),
        ]),
  ].join('\n');
}
