import type { Hand34, RuleName } from './types';
import { calculateUkeireDetailed } from './ukeire';
import { tileIndexToName } from './tileCodec';

export type DiscardGrade = 'S' | 'A' | 'B';

export interface DiscardGradeResult {
  grade: DiscardGrade;
  reason: string;
  ukeire: number;
}

export interface GradeDiscardContext {
  /** true면 방어(안전패 우선) 판단이 필요한 상황 — 6단계 안전도 계산기 연동 시 사용 */
  requiresDefense?: boolean;
}

/** S등급 컷 아래로 A등급을 매기는 상대 기준 (최댓값 대비 비율) */
const A_GRADE_RATIO = 0.6;

/**
 * 손패의 각 버림패 후보에 S/A/B 등급과 이유를 매긴다.
 * 우케이레 계산기를 기반으로 하며, 샨텐이 후퇴하는 버림은 항상 B(악수)로 분류한다.
 */
export function gradeDiscardChoice(
  hand: Hand34,
  _context: GradeDiscardContext = {},
  ruleName: RuleName = 'Riichi',
): Map<number, DiscardGradeResult> {
  const { normal, receding } = calculateUkeireDetailed(hand, ruleName);
  const result = new Map<number, DiscardGradeResult>();

  const maxNormalUkeire = Math.max(0, ...normal.values());

  for (const [discardIndex, ukeire] of normal) {
    if (maxNormalUkeire > 0 && ukeire === maxNormalUkeire) {
      result.set(discardIndex, {
        grade: 'S',
        ukeire,
        reason: `유효패 ${ukeire}매로 샨텐 유지 버림 중 최선입니다.`,
      });
    } else if (maxNormalUkeire > 0 && ukeire >= maxNormalUkeire * A_GRADE_RATIO) {
      result.set(discardIndex, {
        grade: 'A',
        ukeire,
        reason: `유효패 ${ukeire}매로 최선(${maxNormalUkeire}매) 대비 준수한 대안입니다.`,
      });
    } else {
      result.set(discardIndex, {
        grade: 'B',
        ukeire,
        reason: `유효패 ${ukeire}매로 다른 버림에 비해 효율이 낮습니다.`,
      });
    }
  }

  for (const [discardIndex, ukeire] of receding) {
    result.set(discardIndex, {
      grade: 'B',
      ukeire,
      reason: `${tileIndexToName(discardIndex)}을(를) 버리면 샨텐이 후퇴하는 악수입니다.`,
    });
  }

  return result;
}
