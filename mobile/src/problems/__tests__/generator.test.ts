import { describe, expect, it } from 'vitest';
import {
  dealRandomHand,
  generateHandWithShanten,
  generateNanikiruProblem,
  generateRandomWinningHand,
} from '../generator';
import { calculateShanten } from '../../engine/shanten';
import { checkYaku } from '../../engine/yaku';
import { hand34Count } from '../../engine/tileCodec';

/** 테스트 재현성을 위한 결정론적 시드 PRNG (mulberry32) */
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

describe('dealRandomHand', () => {
  it('요청한 매수만큼 패를 뽑고, 각 패는 0~4매 범위를 지킨다', () => {
    const hand = dealRandomHand(14, seededRng(1));
    expect(hand34Count(hand)).toBe(14);
    for (const count of hand) {
      expect(count).toBeGreaterThanOrEqual(0);
      expect(count).toBeLessThanOrEqual(4);
    }
  });

  it('같은 시드면 같은 결과를 재현한다', () => {
    const a = dealRandomHand(13, seededRng(42));
    const b = dealRandomHand(13, seededRng(42));
    expect(a).toEqual(b);
  });
});

describe('generateHandWithShanten', () => {
  it('요청한 샨텐 수의 14장 손패를 생성한다', () => {
    const hand = generateHandWithShanten(1, 14, 'Riichi', seededRng(7));
    expect(hand34Count(hand)).toBe(14);
    expect(calculateShanten(hand)).toBe(1);
  });

  it('텐파이(0샨텐) 손패도 생성할 수 있다', () => {
    const hand = generateHandWithShanten(0, 14, 'Riichi', seededRng(99));
    expect(calculateShanten(hand)).toBe(0);
  });
});

describe('generateNanikiruProblem', () => {
  it('나니키루 문제는 14장 손패와 등급별 정답 목록을 포함한다', () => {
    const problem = generateNanikiruProblem({
      chapter: '2-1',
      theoryTag: ['ukeire-efficiency'],
      difficulty: 'basic',
      rng: seededRng(123),
    });

    expect(hand34Count(problem.hand)).toBe(14);
    expect(problem.answerType).toBe('graded');
    expect(problem.gradedAnswers?.length).toBeGreaterThan(0);
    expect(problem.source).toBe('generated');
    expect(problem.context).toBeUndefined();
  });

  it('realistic 난이도는 context(순서/도라/자리바람 등)를 포함한다', () => {
    const problem = generateNanikiruProblem({
      chapter: '2-1',
      theoryTag: ['ukeire-efficiency'],
      difficulty: 'realistic',
      rng: seededRng(456),
    });

    expect(problem.context).toBeDefined();
    expect(problem.context?.turnCount).toBeGreaterThan(0);
    expect(problem.context?.doraIndicators.length).toBeGreaterThan(0);
  });
});

describe('generateRandomWinningHand', () => {
  it('항상 완성(-1샨텐) 손패를 만든다', () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const { hand, winTile } = generateRandomWinningHand(seededRng(seed));
      expect(hand34Count(hand)).toBe(14);
      expect(calculateShanten(hand)).toBe(-1);
      expect(hand[winTile]).toBeGreaterThan(0);
    }
  });

  it('checkYaku가 에러 없이 판정할 수 있는 손패다', () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const { hand, winTile } = generateRandomWinningHand(seededRng(seed));
      expect(() => checkYaku(hand, { winTile })).not.toThrow();
    }
  });
});
