import { RuleSet } from 'mahjong-tile-efficiency';
import type { Hand34, RuleName } from './types';
import { hand34Count, hand34ToLibHand, tileNameToIndex } from './tileCodec';

type DiscardAcceptance = Record<string, Record<string, number>>;

interface RawUkeireResult {
  shanten: number;
  normalDiscard?: DiscardAcceptance;
  recedingDiscard?: DiscardAcceptance;
}

/**
 * 14장(3n+2) 손패를 기준으로, 각 버림패 후보를 버렸을 때
 * 남는 유효패(우케이레) 종류 수 합계를 계산한다.
 *
 * @returns 버림패 index -> 유효패 매수 합계
 */
export function calculateUkeire(hand: Hand34, ruleName: RuleName = 'Riichi'): Map<number, number> {
  const total = hand34Count(hand);
  if (total % 3 !== 2) {
    throw new Error(
      `calculateUkeire는 3n+2장(버림 대상) 손패가 필요합니다. 현재 매수: ${total}`,
    );
  }

  const ruleSet = new RuleSet(ruleName);
  const libHand = hand34ToLibHand(hand);
  const result = ruleSet.calUkeire(libHand) as RawUkeireResult;

  const ukeireByDiscard = new Map<number, number>();

  const addGroup = (group: DiscardAcceptance | undefined) => {
    if (!group) return;
    for (const [discardName, acceptance] of Object.entries(group)) {
      const totalUkeire = Object.values(acceptance).reduce((sum, n) => sum + n, 0);
      ukeireByDiscard.set(tileNameToIndex(discardName), totalUkeire);
    }
  };

  addGroup(result.normalDiscard);
  addGroup(result.recedingDiscard);

  return ukeireByDiscard;
}
