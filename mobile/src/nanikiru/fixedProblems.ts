import { tileNamesToHand34 } from '../engine/tileCodec';
import { gradeDiscardChoice } from '../engine/grading';
import type { GradedAnswer, Problem } from '../problems/types';

function buildFixedProblem(id: string, chapter: string, theoryTag: string[], tiles: string[]): Problem {
  const hand = tileNamesToHand34(tiles);
  const grades = gradeDiscardChoice(hand);
  const gradedAnswers: GradedAnswer[] = [...grades.entries()].map(([tile, result]) => ({
    tile,
    grade: result.grade,
    reason: result.reason,
  }));

  return {
    id,
    chapter,
    theoryTag,
    difficulty: 'basic',
    hand,
    answerType: 'graded',
    gradedAnswers,
    source: 'fixed',
  };
}

/** 나니키루 챕터 진행 순서. 앞 챕터를 통과해야 다음 챕터가 열린다 */
export const NANIKIRU_CHAPTERS = ['1-1', '1-2', '2-1'] as const;

export const CHAPTER_LABELS: Record<string, string> = {
  '1-1': '1-1. 고립패 정리',
  '1-2': '1-2. 타츠 비교',
  '2-1': '2-1. 우케이레 효율',
};

/** 챕터별로 임의 생성 문제에 붙일 이론 태그 (본훈련/종합응용 공용) */
export const CHAPTER_THEORY_TAG: Record<string, string[]> = {
  '1-1': ['isolated-tile'],
  '1-2': ['taatsu-compare'],
  '2-1': ['ukeire-efficiency'],
};

/**
 * 챕터별 고정문제은행. 문제집의 문제를 그대로 옮기지 않고 직접 구성한
 * 손패이며, 정답은 항상 룰 엔진(gradeDiscardChoice)으로 산출한다.
 *
 * 1-1: 완전히 고립된 패 하나만 정리하면 텐파이가 되는 가장 기초적인 형태.
 * 1-2: 완성된 멘츠는 충분하고, 두 타츠 중 하나를 포기해야 하는 형태(양면/간짱/변짱 비교).
 * 2-1: 우케이레(유효패 매수) 비교가 필요한 1샨텐 형태.
 */
export const FIXED_PROBLEMS_BY_CHAPTER: Record<string, Problem[]> = {
  '1-1': [
    buildFixedProblem('1-1-fixed-1', '1-1', ['isolated-tile'], [
      '2m', '3m', '4m', '5p', '6p', '7p', '3s', '4s', '5s', '7s', '8s', '9m', '9m', '1z',
    ]),
    buildFixedProblem('1-1-fixed-2', '1-1', ['isolated-tile'], [
      '1m', '2m', '3m', '4p', '5p', '6p', '2s', '3s', '4s', '6s', '7s', '8m', '8m', '7z',
    ]),
    buildFixedProblem('1-1-fixed-3', '1-1', ['isolated-tile'], [
      '3m', '4m', '5m', '2p', '3p', '4p', '6s', '7s', '8s', '1s', '2s', '9m', '9m', '9p',
    ]),
  ],
  '1-2': [
    buildFixedProblem('1-2-fixed-1', '1-2', ['taatsu-compare'], [
      '2m', '3m', '4m', '5p', '6p', '7p', '3s', '4s', '7s', '8s', '2p', '4p', '9m', '9m',
    ]),
    buildFixedProblem('1-2-fixed-2', '1-2', ['taatsu-compare'], [
      '4m', '5m', '6m', '2p', '3p', '4p', '6s', '7s', '1s', '3s', '7m', '9m', '5s', '5s',
    ]),
    buildFixedProblem('1-2-fixed-3', '1-2', ['taatsu-compare'], [
      '1m', '2m', '3m', '5p', '6p', '7p', '4s', '5s', '8s', '9s', '3p', '5p', '7z', '7z',
    ]),
  ],
  '2-1': [
    buildFixedProblem('2-1-fixed-1', '2-1', ['ukeire-efficiency'], [
      '1m', '1m', '1m', '6p', '7p', '7p', '1s', '1s', '2s',
      '5s', '5s', '1z', '1z', '1z',
    ]),
    buildFixedProblem('2-1-fixed-2', '2-1', ['ukeire-efficiency'], [
      '3m', '4m', '5m', '7m', '8m', '2p', '3p', '4p', '6p', '7p',
      '2s', '3s', '5s', '5s',
    ]),
    buildFixedProblem('2-1-fixed-3', '2-1', ['ukeire-efficiency'], [
      '5m', '5m', '5m', '3p', '4p', '5p', '7p', '8p', '9p',
      '2s', '3s', '4s', '6s', '8s',
    ]),
  ],
};

export function getFixedProblems(chapterId: string): Problem[] {
  return FIXED_PROBLEMS_BY_CHAPTER[chapterId] ?? [];
}

/** 하위 호환용: 모든 챕터의 고정문제를 이어붙인 전체 목록 */
export const FIXED_PROBLEMS: Problem[] = NANIKIRU_CHAPTERS.flatMap((id) => FIXED_PROBLEMS_BY_CHAPTER[id]);
