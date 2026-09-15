import type { Hand34 } from './types';
import { tileSuitAndValue, indexFromSuitValue } from './tileCodec';

/** 손패에 해당 패가 2장 이상 있어 퐁이 가능한지 */
export function canPon(hand: Hand34, tile: number): boolean {
  return hand[tile] >= 2;
}

/** 손패에 해당 패가 3장 있어 (버림패로) 밍깡이 가능한지 */
export function canMinkan(hand: Hand34, tile: number): boolean {
  return hand[tile] >= 3;
}

/** 손패에 해당 패가 4장 있어 안깡이 가능한지 */
export function canAnkan(hand: Hand34, tile: number): boolean {
  return hand[tile] >= 4;
}

/** 안깡이 가능한 모든 패 목록 */
export function findAnkanCandidates(hand: Hand34): number[] {
  const candidates: number[] = [];
  for (let t = 0; t < 34; t += 1) {
    if (hand[t] >= 4) candidates.push(t);
  }
  return candidates;
}

/**
 * 버려진 tile로 치가 가능한 손패 내 두 패의 조합들을 찾는다.
 * 자패(z)는 슌쯔를 만들 수 없으므로 항상 빈 배열을 반환한다.
 */
export function getChiOptions(hand: Hand34, tile: number): [number, number][] {
  const { suit, value } = tileSuitAndValue(tile);
  if (suit === 'z') return [];

  const has = (v: number): boolean => v >= 1 && v <= 9 && hand[indexFromSuitValue(suit, v)] > 0;
  const at = (v: number): number => indexFromSuitValue(suit, v);

  const options: [number, number][] = [];
  if (has(value - 2) && has(value - 1)) options.push([at(value - 2), at(value - 1)]);
  if (has(value - 1) && has(value + 1)) options.push([at(value - 1), at(value + 1)]);
  if (has(value + 1) && has(value + 2)) options.push([at(value + 1), at(value + 2)]);
  return options;
}
