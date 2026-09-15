import type { Hand34, Meld, Suit } from './types';
import { tileSuitAndValue } from './tileCodec';

export interface YakuContext {
  /** 이미 확정된(울어서 만든 포함) 멘츠. hand에는 포함되지 않은 패들이다 */
  melds?: Meld[];
  /** 화료패 (론/쯔모로 완성시킨 패) */
  winTile: number;
  isTsumo?: boolean;
  /** 선언 시점의 리치 여부 (역 판정기는 이 값을 그대로 신뢰한다) */
  isRiichi?: boolean;
  seatWind?: number;
  roundWind?: number;
}

export interface YakuResult {
  key: string;
  name: string;
}

export interface HandSet {
  type: 'shuntsu' | 'kotsu';
  tiles: number[];
  isOpen: boolean;
}

export interface CompleteDecomposition {
  sets: HandSet[];
  pairTile: number;
}

export interface WinningHand {
  sets: HandSet[];
  pairTile: number;
  yaku: YakuResult[];
  isMenzen: boolean;
}

const HONOR_SUIT: Suit = 'z';

function isTerminalOrHonor(tileIndex: number): boolean {
  const { suit, value } = tileSuitAndValue(tileIndex);
  return suit === HONOR_SUIT || value === 1 || value === 9;
}

interface SuitPartial {
  sets: HandSet[];
  pairTile: number | null;
}

function decomposeStandardSuit(counts: number[], base: number, sequential: boolean): SuitPartial[] {
  const results: SuitPartial[] = [];
  const working = [...counts];

  const nextNonEmpty = (from: number): number => {
    let i = from;
    while (i < working.length && working[i] === 0) i += 1;
    return i;
  };

  const recurse = (pos: number, sets: HandSet[], pairTile: number | null) => {
    const idx = nextNonEmpty(pos);
    if (idx >= working.length) {
      results.push({ sets: [...sets], pairTile });
      return;
    }
    const tileIndex = base + idx;

    if (working[idx] >= 3) {
      working[idx] -= 3;
      sets.push({ type: 'kotsu', tiles: [tileIndex, tileIndex, tileIndex], isOpen: false });
      recurse(idx, sets, pairTile);
      sets.pop();
      working[idx] += 3;
    }

    if (sequential && idx + 2 < working.length && working[idx + 1] > 0 && working[idx + 2] > 0) {
      working[idx] -= 1;
      working[idx + 1] -= 1;
      working[idx + 2] -= 1;
      sets.push({ type: 'shuntsu', tiles: [tileIndex, base + idx + 1, base + idx + 2], isOpen: false });
      recurse(idx, sets, pairTile);
      sets.pop();
      working[idx] += 1;
      working[idx + 1] += 1;
      working[idx + 2] += 1;
    }

    if (pairTile === null && working[idx] >= 2) {
      working[idx] -= 2;
      recurse(idx, sets, tileIndex);
      working[idx] += 2;
    }
  };

  recurse(0, [], null);
  return results;
}

/** 완성된(멘젠 부분) 손패를 4멘츠(외부 멘츠 제외)+1페어로 분해하는 모든 방법을 찾는다 */
function decomposeStandardHand(hand: Hand34): CompleteDecomposition[] {
  const suits: { counts: number[]; base: number; sequential: boolean }[] = [
    { counts: hand.slice(0, 9), base: 0, sequential: true },
    { counts: hand.slice(9, 18), base: 9, sequential: true },
    { counts: hand.slice(18, 27), base: 18, sequential: true },
    { counts: hand.slice(27, 34), base: 27, sequential: false },
  ];

  const perSuit = suits.map(({ counts, base, sequential }) => decomposeStandardSuit(counts, base, sequential));

  let combos: SuitPartial[][] = [[]];
  for (const suitResults of perSuit) {
    const next: SuitPartial[][] = [];
    for (const combo of combos) {
      for (const result of suitResults) {
        next.push([...combo, result]);
      }
    }
    combos = next;
  }

  const decompositions: CompleteDecomposition[] = [];
  for (const combo of combos) {
    const pairTiles = combo.map((r) => r.pairTile).filter((t): t is number => t !== null);
    if (pairTiles.length !== 1) continue;
    decompositions.push({
      sets: combo.flatMap((r) => r.sets),
      pairTile: pairTiles[0],
    });
  }
  return decompositions;
}

function isPinfuWaitOnSet(set: HandSet, winTile: number): boolean {
  if (set.type !== 'shuntsu' || !set.tiles.includes(winTile)) return false;
  const [v, , high] = set.tiles.slice().sort((a, b) => a - b);
  const { value: lowValue } = tileSuitAndValue(v);
  const { value: highValue } = tileSuitAndValue(high);
  const { value: winValue } = tileSuitAndValue(winTile);

  if (winValue === lowValue + 1) return false; // 갱짱(kanchan) 완성
  if (lowValue === 7 && winValue === 7) return false; // 789에서 7로 완성 (펜찬)
  if (lowValue === 1 && winValue === 3) return false; // 123에서 3으로 완성 (펜찬)
  void highValue;
  return true;
}

function isYakuhaiTile(tileIndex: number, context: YakuContext): boolean {
  const { suit, value } = tileSuitAndValue(tileIndex);
  if (suit !== 'z') return false;
  if (value >= 5) return true; // 백/발/중
  const windIndexFromValue = 27 + (value - 1);
  return windIndexFromValue === context.seatWind || windIndexFromValue === context.roundWind;
}

function evaluateDecomposition(decomp: CompleteDecomposition, context: YakuContext): YakuResult[] {
  const openMelds = (context.melds ?? []).map<HandSet>((m) => ({
    type: m.type === 'kotsu' || m.type === 'kantsu' ? 'kotsu' : 'shuntsu',
    tiles: m.tiles,
    isOpen: m.isOpen,
  }));
  const allSets = [...decomp.sets, ...openMelds];
  const isMenzen = openMelds.every((m) => !m.isOpen);

  const allTiles = [...allSets.flatMap((s) => s.tiles), decomp.pairTile, decomp.pairTile];
  const results: YakuResult[] = [];
  const add = (key: string, name: string) => results.push({ key, name });

  if (isMenzen && context.isRiichi) add('riichi', '리치');
  if (isMenzen && context.isTsumo) add('menzen_tsumo', '멘젠 쯔모');

  if (allTiles.every((t) => !isTerminalOrHonor(t))) add('tanyao', '탕야오');

  if (
    isMenzen &&
    allSets.every((s) => s.type === 'shuntsu') &&
    !isYakuhaiTile(decomp.pairTile, context) &&
    allSets.some((s) => isPinfuWaitOnSet(s, context.winTile))
  ) {
    add('pinfu', '핑후');
  }

  for (const set of allSets) {
    if (set.type !== 'kotsu') continue;
    const tile = set.tiles[0];
    const { suit, value } = tileSuitAndValue(tile);
    if (suit === 'z' && value >= 5) add('yakuhai_dragon', '역패(삼원패)');
    if (suit === 'z' && value <= 4) {
      const windIndex = 27 + (value - 1);
      if (windIndex === context.seatWind) add('yakuhai_seat', '역패(자풍)');
      if (windIndex === context.roundWind) add('yakuhai_round', '역패(장풍)');
    }
  }

  if (isMenzen) {
    const shuntsuSignatures = decomp.sets
      .filter((s) => s.type === 'shuntsu')
      .map((s) => s.tiles.slice().sort((a, b) => a - b).join(','));
    const seen = new Set<string>();
    for (const sig of shuntsuSignatures) {
      if (seen.has(sig)) {
        add('iipeiko', '이페코');
        break;
      }
      seen.add(sig);
    }
  }

  if (allSets.every((s) => s.type === 'kotsu')) add('toitoi', '또이또이');

  const suitsUsed = new Set(allTiles.map((t) => tileSuitAndValue(t).suit).filter((s) => s !== 'z'));
  const hasHonor = allTiles.some((t) => tileSuitAndValue(t).suit === 'z');
  if (suitsUsed.size === 1) {
    add(hasHonor ? 'honitsu' : 'chinitsu', hasHonor ? '혼일색' : '청일색');
  }

  return results;
}

function dedupeYaku(list: YakuResult[]): YakuResult[] {
  const unique = new Map<string, YakuResult>();
  for (const y of list) unique.set(y.key, y);
  return [...unique.values()];
}

/**
 * 완성된 손패를 4멘츠+1페어로 분해하고, 가장 역이 많이 나오는(사이타쿠) 해석을
 * 선택해 반환한다. 역 판정기와 점수 계산기가 공통으로 사용하는 내부 로직.
 */
export function getWinningHand(hand: Hand34, context: YakuContext): WinningHand {
  const targetSets = 4 - (context.melds ?? []).length;
  const decompositions = decomposeStandardHand(hand).filter((d) => d.sets.length === targetSets);
  if (decompositions.length === 0) {
    throw new Error('완성된 손패(4멘츠+1페어)가 아닙니다');
  }

  const openMelds = (context.melds ?? []).map<HandSet>((m) => ({
    type: m.type === 'kotsu' || m.type === 'kantsu' ? 'kotsu' : 'shuntsu',
    tiles: m.tiles,
    isOpen: m.isOpen,
  }));
  const isMenzen = openMelds.every((m) => !m.isOpen);

  let bestDecomp = decompositions[0];
  let bestYaku: YakuResult[] = [];
  for (const decomp of decompositions) {
    const yaku = dedupeYaku(evaluateDecomposition(decomp, context));
    if (yaku.length > bestYaku.length) {
      bestYaku = yaku;
      bestDecomp = decomp;
    }
  }

  return {
    sets: [...bestDecomp.sets, ...openMelds],
    pairTile: bestDecomp.pairTile,
    yaku: bestYaku,
    isMenzen,
  };
}

/**
 * 완성된 손패의 성립 역을 판정한다.
 * @param hand 멘젠 부분 손패 (이미 확정된 멘츠는 context.melds로 전달)
 */
export function checkYaku(hand: Hand34, context: YakuContext): YakuResult[] {
  return getWinningHand(hand, context).yaku;
}
