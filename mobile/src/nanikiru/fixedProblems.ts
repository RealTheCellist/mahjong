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

/**
 * 2장(나니키루 기본) 고정문제은행 예시.
 * 문제집의 문제를 그대로 옮기지 않고 직접 구성한 손패이며, 정답은 항상
 * 룰 엔진(gradeDiscardChoice)으로 산출한다.
 */
export const FIXED_PROBLEMS: Problem[] = [
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
];
