import type { HandoffArtifact } from './store.js';

export function deriveTaskFromHandoff(handoff: HandoffArtifact): string {
  const sections = [
    `Continue work from handoff artifact ${handoff.id}.`,
    `Primary goal: ${handoff.activeGoal}`,
    handoff.handoff.owner ? `Current owner/stage: ${handoff.handoff.owner}` : undefined,
    handoff.handoff.notes ? `Handoff notes: ${handoff.handoff.notes}` : undefined,
    handoff.constraints.length > 0 ? ['Constraints:', ...handoff.constraints.map((entry) => `- ${entry}`)].join('\n') : undefined,
    handoff.risks.length > 0 ? ['Known risks:', ...handoff.risks.map((entry) => `- ${entry}`)].join('\n') : undefined,
    handoff.nextActions.length > 0 ? ['Suggested next actions:', ...handoff.nextActions.map((entry) => `- ${entry}`)].join('\n') : undefined,
    handoff.handoffChain.length > 0 ? `Prior handoff lineage: ${[...handoff.handoffChain, handoff.id].join(' -> ')}` : undefined,
  ].filter(Boolean);

  return sections.join('\n\n');
}
