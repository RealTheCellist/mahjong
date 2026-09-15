import { RuleSet } from 'mahjong-tile-efficiency';
import type { Hand34, RuleName } from './types';
import { hand34ToLibHand } from './tileCodec';

/**
 * 샹텐 수를 계산한다.
 * @returns -1 = 화료(완성), 0 = 텐파이, 1 이상 = 샨텐 수
 */
export function calculateShanten(hand: Hand34, ruleName: RuleName = 'Riichi'): number {
  const ruleSet = new RuleSet(ruleName);
  const libHand = hand34ToLibHand(hand);
  return ruleSet.calShanten(libHand);
}
