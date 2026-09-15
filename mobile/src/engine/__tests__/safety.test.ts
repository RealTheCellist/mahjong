import { describe, expect, it } from 'vitest';
import { calculateSafety } from '../safety';
import { createEmptyHand34 } from '../types';
import { tileNameToIndex } from '../tileCodec';

const idx = tileNameToIndex;

describe('calculateSafety', () => {
  it('상대 버림패에 있는 현물은 100점 안전이다', () => {
    const result = calculateSafety(idx('5m'), { opponentDiscards: [idx('5m')] });
    expect(result.isGenbutsu).toBe(true);
    expect(result.score).toBe(100);
  });

  it('양쪽 스지(2m, 8m)가 모두 버려졌으면 full 스지다', () => {
    const result = calculateSafety(idx('5m'), { opponentDiscards: [idx('2m'), idx('8m')] });
    expect(result.isGenbutsu).toBe(false);
    expect(result.sujiType).toBe('full');
    expect(result.score).toBeGreaterThan(50);
  });

  it('한쪽 스지(8m)만 버려졌으면 half 스지다', () => {
    const result = calculateSafety(idx('5m'), { opponentDiscards: [idx('8m')] });
    expect(result.sujiType).toBe('half');
  });

  it('스지 정보가 없으면 none이며 낮은 점수를 받는다', () => {
    const result = calculateSafety(idx('5m'), { opponentDiscards: [] });
    expect(result.sujiType).toBe('none');
    expect(result.score).toBeLessThan(55);
  });

  it('변짝(2m)은 한 방향 스지만 존재한다', () => {
    const result = calculateSafety(idx('2m'), { opponentDiscards: [idx('5m')] });
    expect(result.sujiType).toBe('half');
  });

  it('료멘을 구성할 패가 전부 보이면(노찬스) 안전도가 높다', () => {
    const visibleCounts = createEmptyHand34();
    visibleCounts[idx('3m')] = 4;
    visibleCounts[idx('7m')] = 4;
    const result = calculateSafety(idx('5m'), { opponentDiscards: [], visibleCounts });
    expect(result.isNoChance).toBe(true);
    expect(result.score).toBe(95);
  });

  it('자패는 스지 개념이 없고(none), 4장이 모두 보이면 노찬스다', () => {
    const visibleCounts = createEmptyHand34();
    visibleCounts[idx('1z')] = 4;
    const result = calculateSafety(idx('1z'), { opponentDiscards: [], visibleCounts });
    expect(result.sujiType).toBe('none');
    expect(result.isNoChance).toBe(true);
    expect(result.score).toBe(95);
  });

  it('아무 정보 없는 자패는 위험도가 높게(낮은 점수) 나온다', () => {
    const result = calculateSafety(idx('3z'), { opponentDiscards: [] });
    expect(result.score).toBeLessThan(55);
  });
});
