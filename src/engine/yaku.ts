import type { Hand34, Meld, Suit } from './types';
import { tileSuitAndValue, indexFromSuitValue } from './tileCodec';

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
  type: 'shuntsu' | 'kotsu' | 'kantsu';
  tiles: number[];
  isOpen: boolean;
}

/** toitoi/역패 판정에서 커츠와 동일하게 취급되는 멘츠 타입(깡 포함) */
function isTripletLike(setType: HandSet['type']): boolean {
  return setType === 'kotsu' || setType === 'kantsu';
}

/**
 * 샹퐁(대기)에서 론으로 완성된 커츠는 실질적으로 "밍커"(공개된 멘츠)로 취급한다.
 * 부수 계산과 스안커/산안커 판정에서 이 커츠는 암커로 인정하지 않는다.
 */
export function isRonCompletedKotsu(set: HandSet, context: YakuContext): boolean {
  return set.type === 'kotsu' && !set.isOpen && !context.isTsumo && set.tiles.includes(context.winTile);
}

function isConcealedTripletForYaku(set: HandSet, context: YakuContext): boolean {
  return isTripletLike(set.type) && !set.isOpen && !isRonCompletedKotsu(set, context);
}

export interface CompleteDecomposition {
  sets: HandSet[];
  pairTile: number;
}

export type HandShape = 'standard' | 'chiitoitsu' | 'kokushi';

export interface WinningHand {
  shape: HandShape;
  /** standard 형태에서만 사용된다(치또이츠/국사무쌍은 빈 배열) */
  sets: HandSet[];
  /** standard/국사무쌍의 대표 페어패. 치또이츠는 pairTiles를 대신 사용한다 */
  pairTile: number;
  /** 치또이츠 전용: 7개 페어패 */
  pairTiles?: number[];
  /** 화료 손패를 이루는 모든 패(14장). 도라 집계 등에 공통으로 사용한다 */
  allTiles: number[];
  yaku: YakuResult[];
  isMenzen: boolean;
}

/** 역만 역의 판수. 더블역만은 26으로 표기한다. yaku.ts/scoring.ts가 공유하는 단일 출처다 */
export const YAKUMAN_HAN: Record<string, number> = {
  kokushi: 13,
  kokushi_13: 26,
  suuankou: 13,
  suuankou_tanki: 26,
  daisangen: 13,
  tsuuiisou: 13,
  chinroutou: 13,
  shousuushii: 13,
  daisuushii: 26,
  ryuuiisou: 13,
  chuuren: 13,
  chuuren_9: 26,
  suukantsu: 13,
};

const HONOR_SUIT: Suit = 'z';

function isTerminalOrHonor(tileIndex: number): boolean {
  const { suit, value } = tileSuitAndValue(tileIndex);
  return suit === HONOR_SUIT || value === 1 || value === 9;
}

/** 국사무쌍에 쓰이는 13종(노두패 6종 + 자패 7종) */
const KOKUSHI_TILES = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
/** 녹일색에 쓰이는 패(2·3·4·6·8삭 + 발) */
const GREEN_TILES = new Set([19, 20, 21, 23, 25, 32]);

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

/** 국사무쌍(13면 대기 포함) 판정. 성립하지 않으면 null */
function tryKokushi(hand: Hand34, context: YakuContext): WinningHand | null {
  for (let t = 0; t < 34; t += 1) {
    if (hand[t] > 0 && !KOKUSHI_TILES.includes(t)) return null;
  }
  let pairTile = -1;
  let total = 0;
  for (const t of KOKUSHI_TILES) {
    const c = hand[t];
    if (c === 0) return null; // 13종을 전부 갖고 있어야 한다
    if (c === 2) {
      if (pairTile !== -1) return null;
      pairTile = t;
    } else if (c > 2) {
      return null;
    }
    total += c;
  }
  if (total !== 14 || pairTile === -1) return null;

  const before = [...hand];
  before[context.winTile] -= 1;
  const isThirteenWait = KOKUSHI_TILES.every((t) => before[t] === 1);

  const allTiles = KOKUSHI_TILES.flatMap((t) => Array(hand[t]).fill(t) as number[]);
  return {
    shape: 'kokushi',
    sets: [],
    pairTile,
    allTiles,
    yaku: [
      isThirteenWait
        ? { key: 'kokushi_13', name: '국사무쌍 13면대기' }
        : { key: 'kokushi', name: '국사무쌍' },
    ],
    isMenzen: true,
  };
}

/** 치또이츠(칠대자) 판정. 성립하지 않으면 null */
function tryChiitoitsu(hand: Hand34, context: YakuContext): WinningHand | null {
  const pairTiles: number[] = [];
  for (let t = 0; t < 34; t += 1) {
    if (hand[t] === 0) continue;
    if (hand[t] !== 2) return null; // 같은 패 4장은 두 쌍으로 인정하지 않는다
    pairTiles.push(t);
  }
  if (pairTiles.length !== 7) return null;

  const allTiles = pairTiles.flatMap((t) => [t, t]);
  const yaku: YakuResult[] = [{ key: 'chiitoitsu', name: '치또이츠' }];
  if (allTiles.every((t) => !isTerminalOrHonor(t))) yaku.push({ key: 'tanyao', name: '탕야오' });
  if (context.isRiichi) yaku.push({ key: 'riichi', name: '리치' });
  if (context.isTsumo) yaku.push({ key: 'menzen_tsumo', name: '멘젠 쯔모' });
  const suitsUsed = new Set(allTiles.map((t) => tileSuitAndValue(t).suit).filter((s) => s !== 'z'));
  const hasHonor = allTiles.some((t) => tileSuitAndValue(t).suit === 'z');
  if (suitsUsed.size === 1) {
    yaku.push({ key: hasHonor ? 'honitsu' : 'chinitsu', name: hasHonor ? '혼일색' : '청일색' });
  }

  return { shape: 'chiitoitsu', sets: [], pairTile: pairTiles[0], pairTiles, allTiles, yaku, isMenzen: true };
}

/** 구련보등(순정구련보등 포함) 판정. 표준형 분해와 별개로 손패 전체 모양을 직접 검사한다 */
function checkChuurenPoutou(hand: Hand34, context: YakuContext, isMenzen: boolean): YakuResult | null {
  if (!isMenzen || (context.melds ?? []).length > 0) return null;
  for (let t = 27; t < 34; t += 1) {
    if (hand[t] > 0) return null; // 자패가 섞이면 불가
  }
  const usedSuits = new Set<Suit>();
  for (let t = 0; t < 27; t += 1) if (hand[t] > 0) usedSuits.add(tileSuitAndValue(t).suit);
  if (usedSuits.size !== 1) return null;

  const suit = [...usedSuits][0];
  const base = indexFromSuitValue(suit, 1);
  const counts = hand.slice(base, base + 9);
  if (counts[0] < 3 || counts[8] < 3) return null;
  for (let v = 1; v < 8; v += 1) if (counts[v] < 1) return null;
  if (counts.reduce((a, b) => a + b, 0) !== 14) return null;

  const before = [...counts];
  const { value: winValue } = tileSuitAndValue(context.winTile);
  before[winValue - 1] -= 1;
  const isPure = before.every((c, i) => c === (i === 0 || i === 8 ? 3 : 1));
  return isPure ? { key: 'chuuren_9', name: '순정구련보등' } : { key: 'chuuren', name: '구련보등' };
}

function evaluateDecomposition(decomp: CompleteDecomposition, context: YakuContext): YakuResult[] {
  const openMelds = (context.melds ?? []).map<HandSet>((m) => ({
    type: m.type,
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
    if (!isTripletLike(set.type)) continue;
    const tile = set.tiles[0];
    const { suit, value } = tileSuitAndValue(tile);
    if (suit === 'z' && value >= 5) add('yakuhai_dragon', '역패(삼원패)');
    if (suit === 'z' && value <= 4) {
      const windIndex = 27 + (value - 1);
      if (windIndex === context.seatWind) add('yakuhai_seat', '역패(자풍)');
      if (windIndex === context.roundWind) add('yakuhai_round', '역패(장풍)');
    }
  }

  // 이페코/량페코: 같은 슌쯔 조합이 2세트(이페코) 또는 4세트(량페코, 2쌍)인지 확인한다
  let ryanpeikou = false;
  if (isMenzen) {
    const shuntsuSigs = decomp.sets
      .filter((s) => s.type === 'shuntsu')
      .map((s) => s.tiles.slice().sort((a, b) => a - b).join(','));
    const sigCounts = new Map<string, number>();
    for (const sig of shuntsuSigs) sigCounts.set(sig, (sigCounts.get(sig) ?? 0) + 1);
    const duplicatedPairs = [...sigCounts.values()].filter((c) => c === 2).length;
    if (duplicatedPairs === 2) {
      add('ryanpeikou', '량페코');
      ryanpeikou = true;
    } else if (duplicatedPairs === 1) {
      add('iipeiko', '이페코');
    }
  }
  void ryanpeikou;

  if (allSets.every((s) => isTripletLike(s.type))) add('toitoi', '또이또이');

  const suitsUsed = new Set(allTiles.map((t) => tileSuitAndValue(t).suit).filter((s) => s !== 'z'));
  const hasHonor = allTiles.some((t) => tileSuitAndValue(t).suit === 'z');
  if (suitsUsed.size === 1) {
    add(hasHonor ? 'honitsu' : 'chinitsu', hasHonor ? '혼일색' : '청일색');
  }

  // 삼색동순: 세 수패 모두에서 시작값이 같은 슌쯔가 있는지
  const shuntsuStartsByValue = new Map<number, Set<Suit>>();
  for (const s of allSets) {
    if (s.type !== 'shuntsu') continue;
    const sorted = s.tiles.slice().sort((a, b) => a - b);
    const { suit, value } = tileSuitAndValue(sorted[0]);
    if (!shuntsuStartsByValue.has(value)) shuntsuStartsByValue.set(value, new Set());
    shuntsuStartsByValue.get(value)?.add(suit);
  }
  for (const suits of shuntsuStartsByValue.values()) {
    if (suits.has('m') && suits.has('p') && suits.has('s')) {
      add('sanshoku_doujun', '삼색동순');
      break;
    }
  }

  // 일기통관: 한 수패에서 123/456/789 슌쯔를 모두 가지고 있는지
  const shuntsuStartsBySuit = new Map<Suit, Set<number>>();
  for (const s of allSets) {
    if (s.type !== 'shuntsu') continue;
    const sorted = s.tiles.slice().sort((a, b) => a - b);
    const { suit, value } = tileSuitAndValue(sorted[0]);
    if (!shuntsuStartsBySuit.has(suit)) shuntsuStartsBySuit.set(suit, new Set());
    shuntsuStartsBySuit.get(suit)?.add(value);
  }
  for (const starts of shuntsuStartsBySuit.values()) {
    if (starts.has(1) && starts.has(4) && starts.has(7)) {
      add('ittsuu', '일기통관');
      break;
    }
  }

  // 찬타/준찬타: 모든 멘츠·페어가 노두패 또는 자패를 포함하는지
  if (allSets.every((s) => s.tiles.some((t) => isTerminalOrHonor(t))) && isTerminalOrHonor(decomp.pairTile)) {
    if (hasHonor) add('chanta', '찬타');
    else add('junchan', '준찬타');
  }

  // 산안커/스안커: 암커(론으로 완성된 샹퐁 커츠는 밍커로 취급) 개수
  const concealedTripletCount = allSets.filter((s) => isConcealedTripletForYaku(s, context)).length;
  if (concealedTripletCount === 4) {
    const isTankiWait = context.winTile === decomp.pairTile;
    add(isTankiWait ? 'suuankou_tanki' : 'suuankou', isTankiWait ? '스안커 탕키' : '스안커');
  } else if (concealedTripletCount === 3) {
    add('sanankou', '산안커');
  }

  // 혼노두: 손패 전체가 노두패/자패로만 구성
  if (allTiles.every((t) => isTerminalOrHonor(t))) add('honroutou', '혼노두');

  // 소삼원/대삼원
  const dragonTripletCount = allSets.filter((s) => {
    if (!isTripletLike(s.type)) return false;
    const { suit, value } = tileSuitAndValue(s.tiles[0]);
    return suit === 'z' && value >= 5;
  }).length;
  const pairIsDragon = (() => {
    const { suit, value } = tileSuitAndValue(decomp.pairTile);
    return suit === 'z' && value >= 5;
  })();
  if (dragonTripletCount === 3) add('daisangen', '대삼원');
  else if (dragonTripletCount === 2 && pairIsDragon) add('shousangen', '소삼원');

  // 자일색
  if (allTiles.every((t) => tileSuitAndValue(t).suit === 'z')) add('tsuuiisou', '자일색');

  // 청노두: 자패 없이 노두패(1/9)로만 구성
  if (allTiles.every((t) => {
    const { suit, value } = tileSuitAndValue(t);
    return suit !== 'z' && (value === 1 || value === 9);
  })) {
    add('chinroutou', '청노두');
  }

  // 소사희/대사희
  const windTripletCount = allSets.filter((s) => {
    if (!isTripletLike(s.type)) return false;
    const { suit, value } = tileSuitAndValue(s.tiles[0]);
    return suit === 'z' && value <= 4;
  }).length;
  const pairIsWind = (() => {
    const { suit, value } = tileSuitAndValue(decomp.pairTile);
    return suit === 'z' && value <= 4;
  })();
  if (windTripletCount === 4) add('daisuushii', '대사희');
  else if (windTripletCount === 3 && pairIsWind) add('shousuushii', '소사희');

  // 녹일색
  if (allTiles.every((t) => GREEN_TILES.has(t))) add('ryuuiisou', '녹일색');

  // 스깡쯔
  if ((context.melds ?? []).filter((m) => m.type === 'kantsu').length === 4) add('suukantsu', '스깡쯔');

  return results;
}

function dedupeYaku(list: YakuResult[]): YakuResult[] {
  const unique = new Map<string, YakuResult>();
  for (const y of list) unique.set(y.key, y);
  return [...unique.values()];
}

function containsYakuman(yaku: YakuResult[]): boolean {
  return yaku.some((y) => y.key in YAKUMAN_HAN);
}

/**
 * 완성된 손패를 4멘츠+1페어(또는 치또이츠/국사무쌍)로 분해하고, 역만이 있으면 그것을
 * 우선하고 없으면 가장 역이 많이 나오는(사이타쿠) 해석을 선택해 반환한다.
 * 역 판정기와 점수 계산기가 공통으로 사용하는 내부 로직.
 */
export function getWinningHand(hand: Hand34, context: YakuContext): WinningHand {
  const melds = context.melds ?? [];

  if (melds.length === 0) {
    const kokushi = tryKokushi(hand, context);
    if (kokushi) return kokushi;
  }

  // 량페코 모양의 손패는 구조적으로 항상 치또이츠 모양(7종×2장)과도 일치한다.
  // 표준형으로 분해가 가능하면(더 높은 점수로 이어지는 경우가 대부분) 표준형을 우선하고,
  // 표준형으로 전혀 분해되지 않는 진짜 치또이츠 손패만 치또이츠로 판정한다.
  const targetSets = 4 - melds.length;
  const decompositions = decomposeStandardHand(hand).filter((d) => d.sets.length === targetSets);
  if (decompositions.length === 0) {
    if (melds.length === 0) {
      const chiitoi = tryChiitoitsu(hand, context);
      if (chiitoi) return chiitoi;
    }
    throw new Error('완성된 손패(4멘츠+1페어)가 아닙니다');
  }

  const openMelds = melds.map<HandSet>((m) => ({ type: m.type, tiles: m.tiles, isOpen: m.isOpen }));
  const isMenzen = openMelds.every((m) => !m.isOpen);

  let bestDecomp = decompositions[0];
  let bestYaku: YakuResult[] = [];
  for (const decomp of decompositions) {
    const yaku = dedupeYaku(evaluateDecomposition(decomp, context));
    const better =
      containsYakuman(yaku) && !containsYakuman(bestYaku)
        ? true
        : containsYakuman(bestYaku) && !containsYakuman(yaku)
          ? false
          : yaku.length > bestYaku.length;
    if (better) {
      bestYaku = yaku;
      bestDecomp = decomp;
    }
  }

  const chuuren = checkChuurenPoutou(hand, context, isMenzen);
  if (chuuren) bestYaku = dedupeYaku([...bestYaku, chuuren]);

  const allSets = [...bestDecomp.sets, ...openMelds];
  const allTiles = [...allSets.flatMap((s) => s.tiles), bestDecomp.pairTile, bestDecomp.pairTile];

  return {
    shape: 'standard',
    sets: allSets,
    pairTile: bestDecomp.pairTile,
    allTiles,
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
