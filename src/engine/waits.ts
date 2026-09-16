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

/**
 * 후리텐(버림패 후리텐) 판정: 현재 대기패 중 하나라도 자신이 이미 버린 패에 있으면
 * 텐파이 형태를 바꾸기 전까지는 계속 후리텐 상태다(론 불가, 쯔모는 가능).
 */
export function isDiscardFuriten(hand: Hand34, discards: number[]): boolean {
  const waits = findWaits(hand);
  if (waits.length === 0) return false;
  return waits.some((w) => discards.includes(w));
}
