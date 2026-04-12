import { describe, expect, it } from 'vitest';
import { formatSessionDetail, formatSessionOverview } from '../src/tui/formatters.js';

const session = {
  id: 'session-1',
  title: 'Demo Session',
  createdAt: '2026-04-10T20:00:00.000Z',
  updatedAt: '2026-04-10T20:10:00.000Z',
  messages: [
    { id: 'm1', role: 'system' as const, text: 'system boot', createdAt: '2026-04-10T20:00:00.000Z' },
    { id: 'm2', role: 'user' as const, text: 'hello', createdAt: '2026-04-10T20:01:00.000Z' },
    { id: 'm3', role: 'assistant' as const, text: 'hi there', createdAt: '2026-04-10T20:02:00.000Z' },
    { id: 'm4', role: 'user' as const, text: 'show stats', createdAt: '2026-04-10T20:03:00.000Z' },
  ],
};

describe('session show formatters', () => {
  it('supports limiting human-readable session detail output', () => {
    const text = formatSessionDetail(session, { limit: 2 });
    expect(text).toContain('Showing last 2 messages (2 earlier hidden)');
    expect(text).toContain('[assistant] hi there');
    expect(text).toContain('[user] show stats');
    expect(text).not.toContain('[system] system boot');
  });

  it('renders a compact session overview', () => {
    const text = formatSessionOverview(session);
    expect(text).toContain('Role counts: system=1 user=2 assistant=1');
    expect(text).toContain('Last message: [user] show stats');
  });
});
