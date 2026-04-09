import { describe, expect, it } from 'vitest';
import { runRalphLoop } from '../src/loops/ralph.js';

describe('runRalphLoop', () => {
  it('succeeds when exit-0 condition is met', async () => {
    const result = await runRalphLoop({ command: 'true', until: 'exit-0', maxIterations: 2 });
    expect(result.ok).toBe(true);
  });

  it('succeeds when stdout contains required text', async () => {
    const result = await runRalphLoop({ command: 'printf success', until: 'stdout-includes', matchText: 'success', maxIterations: 2 });
    expect(result.ok).toBe(true);
  });
});
