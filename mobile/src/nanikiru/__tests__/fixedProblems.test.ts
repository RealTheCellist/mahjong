import { describe, expect, it } from 'vitest';
import { FIXED_PROBLEMS, FIXED_PROBLEMS_BY_CHAPTER, NANIKIRU_CHAPTERS, getFixedProblems } from '../fixedProblems';
import { hand34Count } from '../../engine/tileCodec';
import { calculateShanten } from '../../engine/shanten';

describe('FIXED_PROBLEMS', () => {
  it('각 문제는 유효한 14장 손패와 등급별 정답을 가진다', () => {
    for (const problem of FIXED_PROBLEMS) {
      expect(hand34Count(problem.hand)).toBe(14);
      expect(problem.source).toBe('fixed');
      expect(problem.gradedAnswers?.length).toBeGreaterThan(0);
    }
  });

  it('문제 id는 서로 중복되지 않는다', () => {
    const ids = FIXED_PROBLEMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('챕터별 고정문제은행', () => {
  it('진행 순서에 등장하는 모든 챕터가 고정문제를 가진다', () => {
    for (const chapterId of NANIKIRU_CHAPTERS) {
      expect(getFixedProblems(chapterId).length).toBeGreaterThanOrEqual(3);
    }
  });

  it('getFixedProblems는 FIXED_PROBLEMS_BY_CHAPTER와 일치한다', () => {
    for (const chapterId of NANIKIRU_CHAPTERS) {
      expect(getFixedProblems(chapterId)).toBe(FIXED_PROBLEMS_BY_CHAPTER[chapterId]);
    }
  });

  it('각 문제의 S등급 선택은 실제로 1샨텐 이하로 이어진다', () => {
    for (const chapterId of NANIKIRU_CHAPTERS) {
      for (const problem of getFixedProblems(chapterId)) {
        const sTile = problem.gradedAnswers?.find((a) => a.grade === 'S')?.tile;
        expect(sTile).toBeDefined();
        const afterDiscard = [...problem.hand];
        afterDiscard[sTile as number] -= 1;
        expect(calculateShanten(afterDiscard)).toBeLessThanOrEqual(1);
      }
    }
  });
});
