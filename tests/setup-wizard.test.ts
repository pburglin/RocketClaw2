import { describe, expect, it } from 'vitest';
import { runSetupWizard } from '../src/setup/wizard.js';

describe('runSetupWizard', () => {
  it('returns guided setup output', async () => {
    const text = await runSetupWizard();
    expect(text).toContain('RocketClaw2 Setup Wizard');
    expect(text).toContain('Recommended next steps');
  });
});
