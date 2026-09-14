import type { Hand34, Suit } from './types';
import { indexFromSuitValue, tileSuitAndValue } from './tileCodec';

export type SujiType = 'none' | 'half' | 'full';

export interface SafetyContext {
  /** 안전도를 평가할 상대의 버림패 기록 */
  opponentDiscards: number[];
  /** 전체 시야에 보이는 매수(자신 손패+모든 버림패+도라 표시패 등), 노찬스 판정용 */
  visibleCounts?: Hand34;
}

export interface SafetyResult {
  isGenbutsu: boolean;
  sujiType: SujiType;
  isNoChance: boolean;
  /** 0(매우 위험) ~ 100(완전 안전) */
  score: number;
}

interface RyanmenDanger {
  /** 이 타츠 모양 [a, a+1] */
  shape: [number, number];
  /** value가 아닌 반대쪽 대기값 (스지 판정에 사용) */
  otherWait: number;
}

/**
 * value(1~9)를 완성시킬 수 있는 진짜 양면(료멘) 타츠 모양들을 찾는다.
 * 반대쪽 대기값이 1~9 범위를 벗어나면(edge) 그 방향은 사실 펜찬이므로
 * 스지 판정 대상에서 제외한다. 이 조건 때문에 나카스지(양쪽 스지)가
 * 가능한 값은 4/5/6뿐이다.
 */
function getRyanmenDangers(value: number): RyanmenDanger[] {
  const dangers: RyanmenDanger[] = [];
  if (value - 3 >= 1) {
    dangers.push({ shape: [value - 2, value - 1], otherWait: value - 3 });
  }
  if (value + 3 <= 9) {
    dangers.push({ shape: [value + 1, value + 2], otherWait: value + 3 });
  }
  return dangers;
}

/**
 * 특정 패의 특정 상대에 대한 안전도를 계산한다.
 * 현물/스지/노찬스를 기준으로 0~100 안전도 점수를 산출한다.
 */
export function calculateSafety(tileIndex: number, context: SafetyContext): SafetyResult {
  const { suit, value } = tileSuitAndValue(tileIndex);
  const isGenbutsu = context.opponentDiscards.includes(tileIndex);

  if (suit === 'z') {
    const visible = context.visibleCounts?.[tileIndex] ?? 0;
    const isNoChance = visible >= 4;
    let score: number;
    if (isGenbutsu) score = 100;
    else if (isNoChance) score = 95;
    else if (visible === 3) score = 80;
    else score = 30;
    return { isGenbutsu, sujiType: 'none', isNoChance, score };
  }

  const dangers = getRyanmenDangers(value);
  const sujiHits = dangers.map((danger) =>
    context.opponentDiscards.includes(indexFromSuitValue(suit as Suit, danger.otherWait)),
  );

  let sujiType: SujiType;
  if (dangers.length === 2) {
    sujiType = sujiHits[0] && sujiHits[1] ? 'full' : sujiHits.some(Boolean) ? 'half' : 'none';
  } else {
    sujiType = sujiHits[0] ? 'half' : 'none';
  }

  const isNoChance = dangers.every(({ shape: [a, b] }) => {
    const va = context.visibleCounts?.[indexFromSuitValue(suit as Suit, a)] ?? 0;
    const vb = context.visibleCounts?.[indexFromSuitValue(suit as Suit, b)] ?? 0;
    return va >= 4 || vb >= 4;
  });

  let score: number;
  if (isGenbutsu) score = 100;
  else if (isNoChance) score = 95;
  else if (sujiType === 'full') score = 70;
  else if (sujiType === 'half') score = 55;
  else score = 30;

  if (!isGenbutsu && (value === 1 || value === 9)) {
    score = Math.min(100, score + 10);
  }

  return { isGenbutsu, sujiType, isNoChance, score: Math.max(0, Math.min(100, score)) };
}
