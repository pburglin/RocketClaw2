import type { ImportedSkill } from './store.js';

export function formatImportedSkills(skills: ImportedSkill[]): string {
  if (skills.length === 0) return 'No imported skills found.';
  return skills
    .map((skill) => `${skill.id} | ${skill.name} | ${skill.sourceUrl} | updated=${skill.updatedAt}`)
    .join('\n');
}
