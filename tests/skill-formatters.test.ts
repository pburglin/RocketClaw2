import { describe, expect, it } from 'vitest';
import { formatImportedSkills, formatSkillSummary } from '../src/skills/formatters.js';

describe('skill formatters', () => {
  it('formats skill lists and summary views', () => {
    const skills = [
      { id: 'demo', name: 'demo', sourceUrl: 'https://github.com/example/demo.git', installedAt: 't1', updatedAt: 't2', localPath: '/tmp/demo' },
    ];
    expect(formatImportedSkills(skills)).toContain('demo');
    expect(formatSkillSummary(skills)).toContain('Imported skills: 1');
  });
});
