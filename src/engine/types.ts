/**
 * 34종 패 표준 표기: 1m~9m(0~8), 1p~9p(9~17), 1s~9s(18~26), 1z~7z(27~33)
 * 각 인덱스 값은 손에 든 매수(0~4)를 나타낸다.
 */
export type Hand34 = number[];

export type Suit = 'm' | 'p' | 's' | 'z';

export type RuleName = 'Menzu' | 'HK' | 'Riichi' | 'ZungJung' | 'MCR' | 'Taiwan' | 'HKTW';

export interface Meld {
  type: 'shuntsu' | 'kotsu' | 'kantsu';
  tiles: number[];
  isOpen: boolean;
}

export function createEmptyHand34(): Hand34 {
  return new Array(34).fill(0);
}
