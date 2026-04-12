import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { formatRecommendedNextActions, getRecommendedNextActions } from '../src/core/next-actions.js';

describe('next actions', () => {
  it('formats recommended operator actions', () => {
    const text = formatRecommendedNextActions(['Do one thing', 'Do another thing']);
    expect(text).toContain('Recommended next actions:');
    expect(text).toContain('Do another thing');
  });

  it('includes session-mode, self-chat identity, and first-session setup guidance when runtime state is incomplete', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-next-actions-${Date.now()}`);
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(
      path.join(root, 'config.yaml'),
      YAML.stringify({ messaging: { whatsapp: { enabled: true, mode: 'session', selfChatOnly: true } } }),
    );

    const actions = await getRecommendedNextActions(root);
    expect(actions.some((item) => item.includes('whatsapp-config --default-recipient'))).toBe(true);
    expect(actions.some((item) => item.includes('WhatsApp session mode is enabled but no local session is configured'))).toBe(true);
    expect(actions.some((item) => item.includes('whatsapp-config --own-phone-number'))).toBe(true);
    expect(actions.some((item) => item.includes('session-create --title "First Session"'))).toBe(true);

    await fs.rm(root, { recursive: true, force: true });
  });
});
