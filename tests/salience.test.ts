import { describe, expect, it } from 'vitest';
import { calculateSalienceScore, getRecencyWeight } from '../src/memory/salience.js';

describe('memory salience scoring', () => {
  it('boosts score significantly for user-flagged items', () => {
    const score = calculateSalienceScore({
      userFlagged: true,
      contentLength: 10,
      recencyWeight: 0.5,
      keywordDensity: 0
    });
    expect(score).toBeGreaterThan(20);
  });

  it('decays weight over time', () => {
    const now = new Date('2026-04-12T12:00:00Z');
    const recent = '2026-04-12T11:00:00Z';
    const old = '2026-04-11T12:00:00Z';
    
    const weightRecent = getRecencyWeight(recent, now);
    const weightOld = getRecencyWeight(old, now);
    
    expect(weightRecent).toBeGreaterThan(0.9);
    expect(weightOld).toBeCloseTo(0.5, 1);
  });

  it('caps the total score at 100', () => {
    const score = calculateSalienceScore({
      userFlagged: true,
      contentLength: 5000,
      recencyWeight: 1.0,
      keywordDensity: 10
    });
    expect(score).toBe(100);
  });
});
