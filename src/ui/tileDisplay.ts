import type { Suit } from '../engine/types';

export interface TileDisplay {
  suit: Suit;
  number: number;
  /** 접근성용 텍스트 라벨 (예: "5통", "발") */
  numberLabel: string;
}

const HONOR_LABELS = ['동', '남', '서', '북', '백', '발', '중'];
const SUIT_NAME: Record<Suit, string> = {
  m: '만',
  p: '통',
  s: '삭',
  z: '자',
};

/** index(0~33) -> 표시용 정보. UI 전용이며 엔진 로직과는 독립적이다. */
export function getTileDisplay(index: number): TileDisplay {
  if (index < 0 || index > 33) {
    throw new RangeError(`invalid tile index: ${index}`);
  }
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
    numberLabel: suit === 'z' ? HONOR_LABELS[number - 1] : `${number}${SUIT_NAME[suit]}`,
  };
}

/** Hand34를 정렬된 tile index 배열로 펼친다 (개수만큼 반복) */
export function expandHand34(hand: number[]): number[] {
  const tiles: number[] = [];
  hand.forEach((count, index) => {
    for (let i = 0; i < count; i += 1) {
      tiles.push(index);
    }
  });
  return tiles;
}
