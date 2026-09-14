import type { Suit } from '../engine/types';

export interface TileDisplay {
  suit: Suit;
  number: number;
  /** 접근성용 텍스트 라벨 (예: "5통", "발") */
  numberLabel: string;
  /** 숫자 아래 표시할 종류 라벨 (만/통/삭/자패 명) */
  suitLabel: string;
  /** 패 배경색 */
  color: string;
  /** 만수 패의 한자 숫자 (一~九) */
  hanziNumeral?: string;
  /** 자패의 한자 (東南西北白發中) */
  honorChar?: string;
}

const HONOR_LABELS = ['동', '남', '서', '북', '백', '발', '중'];
const HONOR_CHARS = ['東', '南', '西', '北', '白', '發', '中'];
/** 자패별 전통 색상 (바람패=검정, 백=파랑, 발=초록, 중=빨강) */
const HONOR_COLORS = ['#1c1c1c', '#1c1c1c', '#1c1c1c', '#1c1c1c', '#2471a3', '#1e8449', '#c0392b'];
const MAN_NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

const SUIT_COLORS: Record<Suit, string> = {
  m: '#c0392b',
  p: '#2471a3',
  s: '#1e8449',
  z: '#5b2c6f',
};

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
    suitLabel: SUIT_NAME[suit],
    color: suit === 'z' ? HONOR_COLORS[number - 1] : SUIT_COLORS[suit],
    hanziNumeral: suit === 'm' ? MAN_NUMERALS[number - 1] : undefined,
    honorChar: suit === 'z' ? HONOR_CHARS[number - 1] : undefined,
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
