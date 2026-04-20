import { describe, it, expect } from 'vitest';
import { getUserRank } from './ranks';

describe('Ranks Calculation Logic', () => {
  it('assigns Novice Scout accurately (Level 1)', () => {
    // 0 to <5 km
    const rank = getUserRank(0);
    expect(rank.level).toBe(1);
    expect(rank.title).toBe('Novice Scout');
    expect(rank.nextAt).toBe(5);

    const rankEdge = getUserRank(4999);
    expect(rankEdge.level).toBe(1);
  });

  it('assigns Explorer accurately (Level 2)', () => {
    // 5km to <20 km
    const rank = getUserRank(5000);
    expect(rank.level).toBe(2);
    expect(rank.title).toBe('Explorer');
    expect(rank.nextAt).toBe(20);
  });

  it('assigns Legend accurately (Level 6)', () => {
    // > 500 km
    const rank = getUserRank(500000);
    expect(rank.level).toBe(6);
    expect(rank.title).toBe('Legend');
    expect(rank.nextAt).toBeNull();
  });
});
