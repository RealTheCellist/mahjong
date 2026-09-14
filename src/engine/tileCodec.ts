import type { Hand as LibHand } from 'mahjong-tile-efficiency';
import type { Hand34, Suit } from './types';

const SUIT_LENGTHS: Record<Suit, number> = { m: 9, p: 9, s: 9, z: 7 };
const SUIT_ORDER: Suit[] = ['m', 'p', 's', 'z'];

/** index(0~33) -> 표준 패 표기 문자열 (예: 0 -> '1m', 27 -> '1z') */
export function tileIndexToName(index: number): string {
  if (index < 0 || index > 33) {
    throw new RangeError(`invalid tile index: ${index}`);
  }
  if (index < 9) return `${index + 1}m`;
  if (index < 18) return `${index - 9 + 1}p`;
  if (index < 27) return `${index - 18 + 1}s`;
  return `${index - 27 + 1}z`;
}

/** 표준 패 표기 문자열 -> index(0~33) */
export function tileNameToIndex(name: string): number {
  const suit = name[name.length - 1] as Suit;
  const num = Number.parseInt(name.slice(0, -1), 10);
  if (!SUIT_ORDER.includes(suit) || Number.isNaN(num) || num < 1 || num > SUIT_LENGTHS[suit]) {
    throw new RangeError(`invalid tile name: ${name}`);
  }
  const base = SUIT_ORDER.indexOf(suit) * 9;
  return base + (num - 1);
}

/** Hand34 -> mahjong-tile-efficiency 라이브러리 Hand 포맷([man9][pin9][sou9][zi7]) */
export function hand34ToLibHand(hand: Hand34): LibHand {
  if (hand.length !== 34) {
    throw new RangeError(`Hand34 must have length 34, got ${hand.length}`);
  }
  return [
    hand.slice(0, 9),
    hand.slice(9, 18),
    hand.slice(18, 27),
    hand.slice(27, 34),
  ] as unknown as LibHand;
}

/** Hand34에 들어있는 총 매수 */
export function hand34Count(hand: Hand34): number {
  return hand.reduce((sum, n) => sum + n, 0);
}

/** 표준 패 표기 문자열 배열 -> Hand34 */
export function tileNamesToHand34(names: string[]): Hand34 {
  const hand = new Array(34).fill(0);
  for (const name of names) {
    hand[tileNameToIndex(name)] += 1;
  }
  return hand;
}
