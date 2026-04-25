import { describe, expect, it } from 'vitest';
import { resolveHandoffPreset } from '../src/handoff/presets.js';

describe('handoff presets', () => {
  it('resolves role-aware owner and notes defaults', () => {
    expect(resolveHandoffPreset('pm')).toMatchObject({ owner: 'pm' });
    expect(resolveHandoffPreset('architect')).toMatchObject({ owner: 'architect' });
    expect(resolveHandoffPreset('implementer')).toMatchObject({ owner: 'implementer' });
    expect(resolveHandoffPreset('qa')).toMatchObject({ owner: 'qa' });
    expect(resolveHandoffPreset('reviewer')).toMatchObject({ owner: 'reviewer' });
    expect(resolveHandoffPreset('qa').notes).toContain('acceptance criteria');
    expect(resolveHandoffPreset('reviewer').notes).toContain('acceptance criteria');
  });

  it('rejects unknown preset names', () => {
    expect(() => resolveHandoffPreset('unknown')).toThrow('Unknown handoff preset');
  });
});
