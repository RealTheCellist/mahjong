import type { Suit } from '../engine/types';
import { tileSuitAndValue } from '../engine/tileCodec';

const SUITS: Suit[] = ['m', 'p', 's', 'z'];

export function pickRandomSuit(rng: () => number = Math.random): Suit {
  return SUITS[Math.floor(rng() * SUITS.length)];
}

/**
 * "패 종류 골라내기" 미션용 패 더미를 만든다.
 * targetSuit에 해당하는 패 몇 장과, 다른 종류 패 몇 장을 섞어서 반환한다.
 */
export function generateTileSortPool(targetSuit: Suit, rng: () => number = Math.random): number[] {
  const pool: number[] = [];
  const targetCount = 4 + Math.floor(rng() * 3); // 4~6장
  const otherCount = 5 + Math.floor(rng() * 3); // 5~7장
  const otherSuits = SUITS.filter((s) => s !== targetSuit);

  for (let i = 0; i < targetCount; i += 1) {
    const maxValue = targetSuit === 'z' ? 7 : 9;
    pool.push(indexOf(targetSuit, 1 + Math.floor(rng() * maxValue)));
  }
  for (let i = 0; i < otherCount; i += 1) {
    const suit = otherSuits[Math.floor(rng() * otherSuits.length)];
    const maxValue = suit === 'z' ? 7 : 9;
    pool.push(indexOf(suit, 1 + Math.floor(rng() * maxValue)));
  }

  return shuffle(pool, rng);
}

/** 선택한 위치들이 targetSuit 패 위치와 정확히 일치하는지 확인한다 */
export function checkTileSortAnswer(
  pool: number[],
  targetSuit: Suit,
  selectedPositions: Set<number>,
): boolean {
  const correctPositions = new Set(
    pool.map((_, pos) => pos).filter((pos) => tileSuitAndValue(pool[pos]).suit === targetSuit),
  );
  if (correctPositions.size !== selectedPositions.size) return false;
  for (const pos of correctPositions) {
    if (!selectedPositions.has(pos)) return false;
  }
  return true;
}

/** "슌쯔 만들기" 미션용, 한 수(만수) 1~9를 3벌 무작위 순서로 섞은 9장 더미를 만든다 */
export function generateShuntsuPool(rng: () => number = Math.random): number[] {
  const pool: number[] = [];
  for (let value = 1; value <= 9; value += 1) pool.push(indexOf('m', value));
  return shuffle(pool, rng);
}

/** 3장의 tile index가 같은 수패이고 연속된 숫자(순쯔)를 이루는지 확인한다 */
export function isValidRun(tileIndices: number[]): boolean {
  if (tileIndices.length !== 3) return false;
  const infos = tileIndices.map(tileSuitAndValue);
  if (infos.some((info) => info.suit === 'z')) return false;
  if (!infos.every((info) => info.suit === infos[0].suit)) return false;
  const values = infos.map((info) => info.value).sort((a, b) => a - b);
  return values[1] === values[0] + 1 && values[2] === values[1] + 1;
}

function indexOf(suit: Suit, value: number): number {
  const base = { m: 0, p: 9, s: 18, z: 27 }[suit];
  return base + (value - 1);
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
