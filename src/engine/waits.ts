import type { Hand34 } from './types';
import { calculateShanten } from './shanten';

/**
 * 텐파이(샨텐 0) 손패가 완성되는 대기패 목록을 찾는다.
 * 텐파이가 아니면 빈 배열을 반환한다.
 */
export function findWaits(hand: Hand34): number[] {
  if (calculateShanten(hand) !== 0) return [];
  const waits: number[] = [];
  for (let tile = 0; tile < 34; tile += 1) {
    if (hand[tile] >= 4) continue;
    const next = [...hand];
    next[tile] += 1;
    if (calculateShanten(next) === -1) waits.push(tile);
  }
  return waits;
}
