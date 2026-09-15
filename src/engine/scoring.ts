import type { Hand34 } from './types';
import { tileSuitAndValue, indexFromSuitValue } from './tileCodec';
import { getWinningHand, type HandSet, type YakuContext, type YakuResult } from './yaku';

/** 역별 판수. 혼일색/청일색은 멘젠 여부에 따라 달라진다 */
function hanForYaku(key: string, isMenzen: boolean): number {
  switch (key) {
    case 'honitsu':
      return isMenzen ? 3 : 2;
    case 'chinitsu':
      return isMenzen ? 6 : 5;
    case 'toitoi':
      return 2;
    default:
      return 1;
  }
}

/** 도라 표시패 하나가 가리키는 실제 도라 패 */
export function doraTileFromIndicator(indicatorIndex: number): number {
  const { suit, value } = tileSuitAndValue(indicatorIndex);
  if (suit === 'z' && value >= 5) {
    // 백(5)->발(6)->중(7)->백(5)
    return indexFromSuitValue('z', value === 7 ? 5 : value + 1);
  }
  if (suit === 'z') {
    // 동(1)->남(2)->서(3)->북(4)->동(1)
    return indexFromSuitValue('z', value === 4 ? 1 : value + 1);
  }
  return indexFromSuitValue(suit, value === 9 ? 1 : value + 1);
}

function countDora(allTiles: number[], doraIndicators: number[]): number {
  const doraTiles = doraIndicators.map(doraTileFromIndicator);
  return allTiles.filter((t) => doraTiles.includes(t)).length;
}

type WaitType = 'ryanmen' | 'kanchan' | 'penchan' | 'tanki' | 'shanpon';

function getWaitType(sets: HandSet[], pairTile: number, winTile: number): WaitType {
  if (winTile === pairTile) return 'tanki';

  const winningSet = sets.find((s) => s.tiles.includes(winTile));
  if (!winningSet) return 'ryanmen';

  if (winningSet.type === 'kotsu') return 'shanpon';

  const [low, , high] = winningSet.tiles.slice().sort((a, b) => a - b);
  const { value: lowValue } = tileSuitAndValue(low);
  const { value: winValue } = tileSuitAndValue(winTile);
  void high;

  if (winValue === lowValue + 1) return 'kanchan';
  if (lowValue === 7 && winValue === 7) return 'penchan';
  if (lowValue === 1 && winValue === 3) return 'penchan';
  return 'ryanmen';
}

function fuForSet(set: HandSet): number {
  const { suit, value } = tileSuitAndValue(set.tiles[0]);
  const isTerminalOrHonor = suit === 'z' || value === 1 || value === 9;
  if (set.type === 'kotsu') {
    if (set.isOpen) return isTerminalOrHonor ? 4 : 2;
    return isTerminalOrHonor ? 8 : 4;
  }
  if (set.type === 'kantsu') {
    if (set.isOpen) return isTerminalOrHonor ? 16 : 8;
    return isTerminalOrHonor ? 32 : 16;
  }
  return 0;
}

export interface ScoreContext extends YakuContext {
  isDealer: boolean;
  doraIndicators?: number[];
  uraDoraIndicators?: number[];
}

export interface ScoreLine {
  key: string;
  name: string;
  han: number;
}

export interface ScoreResult {
  yaku: YakuResult[];
  /** 역 목록을 판수와 함께 줄 단위로 표시하기 위한 상세 내역 (도라/우라도라 포함) */
  breakdown: ScoreLine[];
  han: number;
  fu: number;
  doraHan: number;
  uraDoraHan: number;
  /** 화료자가 최종적으로 받는 총점 */
  totalPoints: number;
  isDealer: boolean;
  /** 실제 점수 이동 내역(누가 얼마씩 지불하는지) */
  payments: PaymentBreakdown;
}

export type PaymentBreakdown =
  | { type: 'ron'; loserPays: number }
  | { type: 'tsumo-dealer'; eachNonDealerPays: number }
  | { type: 'tsumo-nondealer'; dealerPays: number; eachOtherNonDealerPays: number };

function roundUp100(n: number): number {
  return Math.ceil(n / 100) * 100;
}

function baseScorePoints(han: number, fu: number): number {
  if (han >= 13) return 8000; // 역만
  if (han >= 11) return 6000; // 삼배만
  if (han >= 8) return 4000; // 배만
  if (han >= 6) return 3000; // 하네만
  return Math.min(fu * 2 ** (2 + han), 2000); // 만관 상한
}

/**
 * 완성된 손패의 판수·부수·점수를 계산한다.
 * 치또이/역만 형태는 지원하지 않는다(표준형 4멘츠+1페어 한정).
 */
export function calculateScore(hand: Hand34, context: ScoreContext): ScoreResult {
  const winningHand = getWinningHand(hand, context);
  if (winningHand.yaku.length === 0) {
    throw new Error('역이 없는 손패는 화료할 수 없습니다');
  }

  const allTiles = [
    ...winningHand.sets.flatMap((s) => s.tiles),
    winningHand.pairTile,
    winningHand.pairTile,
  ];

  const doraHan = countDora(allTiles, context.doraIndicators ?? []);
  const uraDoraHan = context.isRiichi ? countDora(allTiles, context.uraDoraIndicators ?? []) : 0;

  const han =
    winningHand.yaku.reduce((sum, y) => sum + hanForYaku(y.key, winningHand.isMenzen), 0) + doraHan + uraDoraHan;

  const isPinfu = winningHand.yaku.some((y) => y.key === 'pinfu');
  let fu = 20;
  if (!isPinfu) {
    if (!context.isTsumo && winningHand.isMenzen) fu += 10; // 멘젠 론
    if (context.isTsumo) fu += 2;
    for (const set of winningHand.sets) fu += fuForSet(set);
    const waitType = getWaitType(winningHand.sets, winningHand.pairTile, context.winTile);
    if (waitType === 'kanchan' || waitType === 'penchan' || waitType === 'tanki') fu += 2;
    const { suit, value } = tileSuitAndValue(winningHand.pairTile);
    const isPairYakuhai =
      suit === 'z' &&
      (value >= 5 || winningHand.pairTile === context.seatWind || winningHand.pairTile === context.roundWind);
    if (isPairYakuhai) fu += 2;
    fu = Math.ceil(fu / 10) * 10;
  } else if (context.isTsumo) {
    fu = 20;
  } else {
    fu = 30; // 핑후 론은 관례상 30부 고정
  }

  const base = baseScorePoints(han, fu);
  let totalPoints: number;
  let payments: PaymentBreakdown;

  if (context.isTsumo) {
    if (context.isDealer) {
      const eachNonDealerPays = roundUp100(base * 2);
      totalPoints = eachNonDealerPays * 3;
      payments = { type: 'tsumo-dealer', eachNonDealerPays };
    } else {
      const dealerPays = roundUp100(base * 2);
      const eachOtherNonDealerPays = roundUp100(base);
      totalPoints = dealerPays + eachOtherNonDealerPays * 2;
      payments = { type: 'tsumo-nondealer', dealerPays, eachOtherNonDealerPays };
    }
  } else {
    const loserPays = roundUp100(base * (context.isDealer ? 6 : 4));
    totalPoints = loserPays;
    payments = { type: 'ron', loserPays };
  }

  const breakdown: ScoreLine[] = winningHand.yaku.map((y) => ({
    key: y.key,
    name: y.name,
    han: hanForYaku(y.key, winningHand.isMenzen),
  }));
  if (doraHan > 0) breakdown.push({ key: 'dora', name: `도라 ×${doraHan}`, han: doraHan });
  if (uraDoraHan > 0) breakdown.push({ key: 'ura_dora', name: `뒷도라 ×${uraDoraHan}`, han: uraDoraHan });

  return {
    yaku: winningHand.yaku,
    breakdown,
    han,
    fu,
    doraHan,
    uraDoraHan,
    totalPoints,
    isDealer: context.isDealer,
    payments,
  };
}
