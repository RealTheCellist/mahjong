import { RuleSet } from 'mahjong-tile-efficiency';
import type { Hand34, RuleName } from './types';
import { hand34Count, hand34ToLibHand, tileNameToIndex } from './tileCodec';

type DiscardAcceptance = Record<string, Record<string, number>>;

interface RawUkeireResult {
  shanten: number;
  normalDiscard?: DiscardAcceptance;
  recedingDiscard?: DiscardAcceptance;
}

export interface UkeireDetail {
  /** 샨텐을 유지하는 버림패 index -> 유효패 매수 합계 */
  normal: Map<number, number>;
  /** 샨텐이 후퇴하는(악수) 버림패 index -> 유효패 매수 합계 */
  receding: Map<number, number>;
}

function sumAcceptance(group: DiscardAcceptance | undefined): Map<number, number> {
  const map = new Map<number, number>();
  if (!group) return map;
  for (const [discardName, acceptance] of Object.entries(group)) {
    const totalUkeire = Object.values(acceptance).reduce((sum, n) => sum + n, 0);
    map.set(tileNameToIndex(discardName), totalUkeire);
  }
  return map;
}

/**
 * 14장(3n+2) 손패를 기준으로, 각 버림패 후보를 버렸을 때 남는 유효패(우케이레)를
 * 샨텐 유지(normal) / 샨텐 후퇴(receding)로 나누어 계산한다.
 */
export function calculateUkeireDetailed(hand: Hand34, ruleName: RuleName = 'Riichi'): UkeireDetail {
  const total = hand34Count(hand);
  if (total % 3 !== 2) {
    throw new Error(
      `calculateUkeire는 3n+2장(버림 대상) 손패가 필요합니다. 현재 매수: ${total}`,
    );
  }

  const ruleSet = new RuleSet(ruleName);
  const libHand = hand34ToLibHand(hand);
  const result = ruleSet.calUkeire(libHand) as RawUkeireResult;

  return {
    normal: sumAcceptance(result.normalDiscard),
    receding: sumAcceptance(result.recedingDiscard),
  };
}

/**
 * 14장(3n+2) 손패를 기준으로, 각 버림패 후보를 버렸을 때
 * 남는 유효패(우케이레) 종류 수 합계를 계산한다 (샨텐 유지/후퇴 구분 없이 합산).
 *
 * @returns 버림패 index -> 유효패 매수 합계
 */
export function calculateUkeire(hand: Hand34, ruleName: RuleName = 'Riichi'): Map<number, number> {
  const { normal, receding } = calculateUkeireDetailed(hand, ruleName);
  return new Map([...normal, ...receding]);
}
