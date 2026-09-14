import { indexFromSuitValue, tileSuitAndValue } from './tileCodec';

export type TaatsuType = 'ryanmen' | 'kanchan' | 'penchan' | 'shanpon';

export interface TaatsuClassification {
  type: TaatsuType;
  /** 이 타츠를 완성시키는 대기패 index 목록 */
  waits: number[];
  /** 대기패 매수 합계 (다른 곳에서 보인 패는 고려하지 않은 이론상 최대값) */
  ukeire: number;
}

/**
 * 2장 조합을 타츠 형태로 분류한다.
 * @param tiles 서로 다른 두 장의 tile index, 또는 같은 index 2개(대짝)
 */
export function classifyTaatsu(tiles: [number, number]): TaatsuClassification {
  const [aIndex, bIndex] = tiles;

  if (aIndex === bIndex) {
    return { type: 'shanpon', waits: [aIndex], ukeire: 4 - 2 };
  }

  const a = tileSuitAndValue(aIndex);
  const b = tileSuitAndValue(bIndex);

  if (a.suit !== b.suit || a.suit === 'z') {
    throw new Error('숫자패 두 장(같은 종류)만 순서형 타츠로 분류할 수 있습니다');
  }

  const [lo, hi] = a.value < b.value ? [a, b] : [b, a];
  const diff = hi.value - lo.value;

  if (diff === 1) {
    if (lo.value === 1) {
      const wait = indexFromSuitValue(lo.suit, lo.value + 2);
      return { type: 'penchan', waits: [wait], ukeire: 4 };
    }
    if (hi.value === 9) {
      const wait = indexFromSuitValue(lo.suit, lo.value - 1);
      return { type: 'penchan', waits: [wait], ukeire: 4 };
    }
    const waits = [
      indexFromSuitValue(lo.suit, lo.value - 1),
      indexFromSuitValue(lo.suit, hi.value + 1),
    ];
    return { type: 'ryanmen', waits, ukeire: waits.length * 4 };
  }

  if (diff === 2) {
    const wait = indexFromSuitValue(lo.suit, lo.value + 1);
    return { type: 'kanchan', waits: [wait], ukeire: 4 };
  }

  throw new Error('타츠로 분류할 수 없는 조합입니다 (서로 인접하지 않음)');
}
