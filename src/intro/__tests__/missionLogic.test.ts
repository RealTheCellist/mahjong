import { describe, expect, it } from 'vitest';
import {
  checkTileSortAnswer,
  generateShuntsuPool,
  generateTileSortPool,
  isValidRun,
} from '../missionLogic';
import { tileNameToIndex, tileSuitAndValue } from '../../engine/tileCodec';

function seededRng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('generateTileSortPool / checkTileSortAnswer', () => {
  it('생성된 더미에서 정답 위치를 정확히 고르면 통과한다', () => {
    const pool = generateTileSortPool('m', seededRng(1));
    const correctPositions = new Set(
      pool.map((_, pos) => pos).filter((pos) => tileSuitAndValue(pool[pos]).suit === 'm'),
    );
    expect(checkTileSortAnswer(pool, 'm', correctPositions)).toBe(true);
  });

  it('하나라도 빠뜨리면 실패한다', () => {
    const pool = generateTileSortPool('p', seededRng(2));
    const correctPositions = new Set(
      pool.map((_, pos) => pos).filter((pos) => tileSuitAndValue(pool[pos]).suit === 'p'),
    );
    const missingOne = new Set(correctPositions);
    const [first] = missingOne;
    missingOne.delete(first);
    expect(checkTileSortAnswer(pool, 'p', missingOne)).toBe(false);
  });

  it('엉뚱한 패를 하나라도 더 고르면 실패한다', () => {
    const pool = generateTileSortPool('s', seededRng(3));
    const correctPositions = new Set(
      pool.map((_, pos) => pos).filter((pos) => tileSuitAndValue(pool[pos]).suit === 's'),
    );
    const wrongPos = pool.findIndex((_, pos) => !correctPositions.has(pos));
    const withExtra = new Set(correctPositions);
    withExtra.add(wrongPos);
    expect(checkTileSortAnswer(pool, 's', withExtra)).toBe(false);
  });
});

describe('generateShuntsuPool / isValidRun', () => {
  it('만수 1~9를 정확히 한 벌씩 담고 있다', () => {
    const pool = generateShuntsuPool(seededRng(5));
    expect(pool).toHaveLength(9);
    const values = pool.map((t) => tileSuitAndValue(t).value).sort((a, b) => a - b);
    expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('연속된 세 패는 순서와 무관하게 순쯔로 인정한다', () => {
    const idx = tileNameToIndex;
    expect(isValidRun([idx('3m'), idx('1m'), idx('2m')])).toBe(true);
  });

  it('연속되지 않은 세 패는 순쯔가 아니다', () => {
    const idx = tileNameToIndex;
    expect(isValidRun([idx('1m'), idx('2m'), idx('4m')])).toBe(false);
  });

  it('자패가 섞여 있으면 순쯔가 될 수 없다', () => {
    const idx = tileNameToIndex;
    expect(isValidRun([idx('1z'), idx('2z'), idx('3z')])).toBe(false);
  });

  it('수패라도 종류가 다르면 순쯔가 아니다', () => {
    const idx = tileNameToIndex;
    expect(isValidRun([idx('1m'), idx('2p'), idx('3s')])).toBe(false);
  });
});
