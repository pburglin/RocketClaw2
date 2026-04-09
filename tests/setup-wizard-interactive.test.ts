import { describe, expect, it } from 'vitest';
import { runSetupWizard } from '../src/setup/wizard.js';

describe('setup wizard guidance', () => {
  it('mentions how to configure llm api keys clearly', async () => {
    const text = await runSetupWizard(false);
    expect(text).toContain('llm.apiKey');
    expect(text).toContain('--llm-api-key');
  });
});
