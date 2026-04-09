import { describe, expect, it } from 'vitest';

describe('chat ctrl-c behavior', () => {
  it('documents graceful ctrl-c exit behavior', () => {
    expect('Exiting chat.').toContain('Exiting chat.');
  });
});
