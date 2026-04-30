import { describe, expect, it } from 'vitest';
import { findBuiltInSkill, formatBuiltInSkillsRoadmap, getBuiltInSkillsRoadmap } from '../src/skills/built-in-roadmap.js';

describe('built-in skills roadmap', () => {
  it('formats the full roadmap and supports per-skill lookup', () => {
    const roadmap = getBuiltInSkillsRoadmap();
    const text = formatBuiltInSkillsRoadmap(roadmap);
    expect(text).toContain('RocketClaw2 Built-in Skills');
    expect(text).toContain('Ralph Loop');
    expect(text).toContain('Operator cadence:');

    const skill = findBuiltInSkill('second-brain');
    expect(skill?.roadmapDoc).toBe('docs/skills-roadmap/SECOND-BRAIN.md');
  });
});
