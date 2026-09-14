import { describe, expect, it } from 'vitest';
import { FIXED_PROBLEMS } from '../fixedProblems';
import { hand34Count } from '../../engine/tileCodec';

describe('FIXED_PROBLEMS', () => {
  it('최소 3개 이상의 고정문제를 포함한다', () => {
    expect(FIXED_PROBLEMS.length).toBeGreaterThanOrEqual(3);
  });

  it('각 문제는 유효한 14장 손패와 등급별 정답을 가진다', () => {
    for (const problem of FIXED_PROBLEMS) {
      expect(hand34Count(problem.hand)).toBe(14);
      for (const count of problem.hand) {
        expect(count).toBeGreaterThanOrEqual(0);
        expect(count).toBeLessThanOrEqual(4);
      }
      expect(problem.source).toBe('fixed');
      expect(problem.gradedAnswers?.length).toBeGreaterThan(0);
    }
  });

  it('문제 id는 서로 중복되지 않는다', () => {
    const ids = FIXED_PROBLEMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
