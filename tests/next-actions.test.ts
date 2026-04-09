import { describe, expect, it } from 'vitest';
import { formatRecommendedNextActions } from '../src/core/next-actions.js';

describe('next actions', () => {
  it('formats recommended operator actions', () => {
    const text = formatRecommendedNextActions(['Do one thing', 'Do another thing']);
    expect(text).toContain('Recommended next actions:');
    expect(text).toContain('Do another thing');
  });
});
