import { describe, expect, it } from 'vitest';
import { formatRalphLoopResult } from '../src/loops/ralph-formatters.js';
import { resolveRalphPreset } from '../src/loops/ralph.js';

describe('ralph loop operator helpers', () => {
  it('formats loop results and resolves validation presets', () => {
    const text = formatRalphLoopResult({ ok: true, iterations: 2, condition: 'exit-0', lastStdout: 'ok', lastStderr: '' });
    expect(text).toContain('Status: ok');
    expect(resolveRalphPreset('validate').command).toBe('npm test');
    expect(resolveRalphPreset('build').command).toBe('npm run build');
    expect(resolveRalphPreset('lint').command).toBe('npm run lint');
    expect(resolveRalphPreset('docs').command).toBe('npm run build');
    expect(resolveRalphPreset('pack').command).toBe('npm run verify:pack');
  });
});
