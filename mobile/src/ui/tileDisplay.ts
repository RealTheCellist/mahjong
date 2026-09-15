import type { Suit } from '../engine/types';

export interface TileDisplay {
  suit: Suit;
  number: number;
  numberLabel: string;
  suitLabel: string;
  color: string;
}

const HONOR_LABELS = ['동', '남', '서', '북', '백', '발', '중'];
const SUIT_COLORS: Record<Suit, string> = {
  m: '#c0392b',
  p: '#2471a3',
  s: '#1e8449',
  z: '#5b2c6f',
};
const SUIT_NAME: Record<Suit, string> = { m: '만', p: '통', s: '삭', z: '자' };

export function getTileDisplay(index: number): TileDisplay {
  if (index < 0 || index > 33) throw new RangeError(`invalid tile index: ${index}`);
  let suit: Suit;
  let number: number;
  if (index < 9) {
    suit = 'm';
    number = index + 1;
  } else if (index < 18) {
    suit = 'p';
    number = index - 9 + 1;
  } else if (index < 27) {
    suit = 's';
    number = index - 18 + 1;
  } else {
    suit = 'z';
    number = index - 27 + 1;
  }
  return {
    suit,
    number,
    numberLabel: suit === 'z' ? HONOR_LABELS[number - 1] : String(number),
    suitLabel: SUIT_NAME[suit],
    color: SUIT_COLORS[suit],
  };
}

export function expandHand34(hand: number[]): number[] {
  const tiles: number[] = [];
  hand.forEach((count, index) => {
    for (let i = 0; i < count; i += 1) tiles.push(index);
  });
  return tiles;
}
