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

  it('assigns Pathfinder accurately (Level 3)', () => {
    const rank = getUserRank(20000);
    expect(rank.level).toBe(3);
    expect(rank.title).toBe('Pathfinder');
    expect(rank.nextAt).toBe(50);
  });

  it('assigns Conqueror accurately (Level 4)', () => {
    const rank = getUserRank(50000);
    expect(rank.level).toBe(4);
    expect(rank.title).toBe('Conqueror');
    expect(rank.nextAt).toBe(100);
  });

  it('assigns Grandmaster accurately (Level 5)', () => {
    const rank = getUserRank(100000);
    expect(rank.level).toBe(5);
    expect(rank.title).toBe('Grandmaster');
    expect(rank.nextAt).toBe(500);
  });

  it('assigns Legend accurately (Level 6)', () => {
    // > 500 km
    const rank = getUserRank(500000);
    expect(rank.level).toBe(6);
    expect(rank.title).toBe('Legend');
    expect(rank.nextAt).toBeNull();
  });
});
