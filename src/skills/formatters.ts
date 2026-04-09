import type { ImportedSkill } from './store.js';

export function formatImportedSkills(skills: ImportedSkill[]): string {
  if (skills.length === 0) return 'No imported skills found.';
  return skills
    .map((skill) => `${skill.id} | ${skill.name} | ${skill.sourceUrl} | action=${skill.lastAction} | updates=${skill.updateCount} | updated=${skill.updatedAt}`)
    .join('\n');
}

export function formatSkillSummary(skills: ImportedSkill[]): string {
  const total = skills.length;
  const sources = skills.map((skill) => skill.sourceUrl).slice(0, 5).join(', ');
  const updated = skills.filter((skill) => skill.lastAction === 'updated').length;
  return [
    `Imported skills: ${total}`,
    `Updated skills: ${updated}`,
    `Sources: ${sources || 'n/a'}`,
  ].join('\n');
}
