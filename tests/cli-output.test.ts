import { describe, expect, it } from 'vitest';
import { buildFloatingFooterClear, buildFloatingFooterRender } from '../src/cli-output.js';

describe('cli floating footer control sequences', () => {
  it('redraws the waiting footer without injecting a newline', () => {
    const sequence = buildFloatingFooterRender('| › [iter 1] AI is thinking... (15s elapsed, press Ctrl+C to cancel)');
    expect(sequence).not.toContain('\n');
    expect(sequence).toContain('\r');
  });

  it('clears the waiting footer without injecting a newline', () => {
    const sequence = buildFloatingFooterClear();
    expect(sequence).not.toContain('\n');
    expect(sequence).toContain('\r');
  });
});
