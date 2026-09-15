import type { Hand34 } from '../engine/types';
import { createEmptyHand34 } from '../engine/types';
import { gradeDiscardChoice, type DiscardGrade } from '../engine/grading';
import { calculateShanten } from '../engine/shanten';
import { canPon, canMinkan, getChiOptions, findAnkanCandidates } from '../engine/calls';
import type { GameState, PlayerState, AiLevel } from './types';
import { isTenpaiAfterDiscard, bumpHand } from './gameEngine';

/**
 * 난이도별 등급 가중치. 인덱스는 [S, A, B] 확률이며 합은 1이 되어야 한다.
 * hard는 거의 항상 최선수를 두지만, normal/easy로 갈수록 사람다운 실수(효율이
 * 낮은 패를 고르는 선택)가 섞이도록 확률을 분산시킨다.
 */
const GRADE_WEIGHTS: Record<AiLevel, Record<DiscardGrade, number>> = {
  hard: { S: 0.92, A: 0.07, B: 0.01 },
  normal: { S: 0.65, A: 0.27, B: 0.08 },
  easy: { S: 0.4, A: 0.35, B: 0.25 },
};

/** 난이도별 리치 선언 확률 (텐파이가 되어도 사람은 항상 즉시 리치를 걸지는 않는다) */
const RIICHI_PROBABILITY: Record<AiLevel, number> = {
  hard: 0.95,
  normal: 0.75,
  easy: 0.5,
};

/** 방어(오리) 판단을 시작하는 난이도별 성향. easy는 초심자처럼 방어를 잘 하지 않는다 */
const DEFENSE_AWARENESS: Record<AiLevel, number> = {
  hard: 1,
  normal: 0.8,
  easy: 0.2,
};

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function weightedGradePick(level: AiLevel, rng: () => number): DiscardGrade {
  const weights = GRADE_WEIGHTS[level];
  const roll = rng();
  if (roll < weights.S) return 'S';
  if (roll < weights.S + weights.A) return 'A';
  return 'B';
}

function buildVisibleCounts(state: GameState): Hand34 {
  const visible = createEmptyHand34();
  for (const p of state.players) {
    for (let t = 0; t < 34; t += 1) visible[t] += p.hand[t];
    for (const d of p.discards) visible[d] += 1;
  }
  for (const d of state.doraIndicators) visible[d] += 1;
  return visible;
}

/** 리치 중인 상대가 있는지, 있다면 그 상대들의 버림패를 합쳐서 반환한다 */
function riichiOpponentDiscards(state: GameState, self: PlayerState): number[] | null {
  const riichiOpponents = state.players.filter((p) => p.seat !== self.seat && p.isRiichi);
  if (riichiOpponents.length === 0) return null;
  return riichiOpponents.flatMap((p) => p.discards);
}

export interface AiDiscardDecision {
  tile: number;
  declareRiichi: boolean;
}

/**
 * 지정한 자리의 AI가 현재 손패(14장)에서 무엇을 버릴지, 리치를 선언할지 결정한다.
 * 난이도에 따라 최선수 대신 준수한 대안이나 실수를 섞어 "사람다운" 판단을 흉내낸다.
 */
export function decideAiDiscard(state: GameState, seat: number, rng: () => number = Math.random): AiDiscardDecision {
  const player = state.players[seat];
  const level = player.aiLevel ?? 'normal';

  const opponentDiscards = riichiOpponentDiscards(state, player);
  const isDefenseAware = opponentDiscards !== null && rng() < DEFENSE_AWARENESS[level];

  const grades = gradeDiscardChoice(
    player.hand,
    isDefenseAware
      ? {
          requiresDefense: true,
          safety: { opponentDiscards: opponentDiscards as number[], visibleCounts: buildVisibleCounts(state) },
        }
      : {},
  );

  const byGrade: Record<DiscardGrade, number[]> = { S: [], A: [], B: [] };
  for (const [tile, result] of grades) byGrade[result.grade].push(tile);

  let targetGrade = weightedGradePick(level, rng);
  // 선택한 등급에 후보가 없으면 차상위 등급으로 대체한다
  const fallbackOrder: DiscardGrade[] = ['S', 'A', 'B'];
  if (byGrade[targetGrade].length === 0) {
    targetGrade = fallbackOrder.find((g) => byGrade[g].length > 0) ?? 'B';
  }

  const tile = pickRandom(byGrade[targetGrade], rng);
  const canRiichi = !player.isRiichi && player.score >= 1000 && isTenpaiAfterDiscard(player.hand, tile);
  const declareRiichi = canRiichi && rng() < RIICHI_PROBABILITY[level];

  return { tile, declareRiichi };
}

/**
 * 지정한 자리의 AI가 방금 뽑은 패로 쯔모 화료가 가능할 때 실제로 화료할지 결정한다.
 * 실전에서 화료 가능한 손을 흘려보내는 경우는 거의 없으므로 항상 화료한다.
 */
export function decideAiTsumo(): boolean {
  return true;
}

/**
 * 지정한 자리의 AI가 상대의 버림패로 론 화료가 가능할 때 실제로 화료할지 결정한다.
 * 화료 가능한 손을 놓치는 경우는 거의 없으므로 항상 화료한다.
 */
export function decideAiRon(): boolean {
  return true;
}

/** 참고용: 현재 손패의 샨텐수 (AI 판단 로직 디버깅/표시에 사용 가능) */
export function aiShanten(hand: Hand34): number {
  return calculateShanten(hand);
}

/**
 * 콜(치/퐁/깡)로 손을 열지 판단하는 공통 기준.
 * 샨텐이 확실히 좋아지면 항상 부르고, 그대로면 난이도별 확률로,
 * 오히려 나빠지면 초급자만 가끔 실수로 부른다(사람다운 판단 흉내).
 */
function shouldCall(level: AiLevel, shantenBefore: number, shantenAfter: number, rng: () => number): boolean {
  if (shantenAfter < shantenBefore) return true;
  if (shantenAfter === shantenBefore) return rng() < CALL_EVEN_IF_NEUTRAL[level];
  return level === 'easy' && rng() < 0.15;
}

const CALL_EVEN_IF_NEUTRAL: Record<AiLevel, number> = { hard: 0.3, normal: 0.55, easy: 0.8 };
const MINKAN_WILLINGNESS: Record<AiLevel, number> = { hard: 0.4, normal: 0.5, easy: 0.65 };
const ANKAN_WILLINGNESS: Record<AiLevel, number> = { hard: 0.9, normal: 0.75, easy: 0.5 };

/** seat가 방금 버려진 패로 퐁을 부를지 결정한다 */
export function decideAiPon(state: GameState, seat: number, rng: () => number = Math.random): boolean {
  if (!state.lastDiscard) return false;
  const player = state.players[seat];
  if (player.isRiichi) return false;
  const tile = state.lastDiscard.tile;
  if (!canPon(player.hand, tile)) return false;

  const shantenBefore = calculateShanten(player.hand);
  const afterHand = bumpHand(player.hand, tile, -2);
  const shantenAfter = calculateShanten(afterHand);
  return shouldCall(player.aiLevel ?? 'normal', shantenBefore, shantenAfter, rng);
}

/** seat가 방금 버려진 패로 치를 부를지 결정한다. 부른다면 사용할 손패 두 장을 반환한다 */
export function decideAiChi(
  state: GameState,
  seat: number,
  rng: () => number = Math.random,
): [number, number] | null {
  if (!state.lastDiscard) return null;
  const player = state.players[seat];
  if (player.isRiichi) return null;

  const options = getChiOptions(player.hand, state.lastDiscard.tile);
  if (options.length === 0) return null;

  const shantenBefore = calculateShanten(player.hand);
  let best: { opt: [number, number]; shanten: number } | null = null;
  for (const opt of options) {
    const afterHand = bumpHand(bumpHand(player.hand, opt[0], -1), opt[1], -1);
    const shanten = calculateShanten(afterHand);
    if (!best || shanten < best.shanten) best = { opt, shanten };
  }
  if (!best) return null;
  return shouldCall(player.aiLevel ?? 'normal', shantenBefore, best.shanten, rng) ? best.opt : null;
}

/** seat가 방금 버려진 패로 밍깡을 부를지 결정한다 */
export function decideAiKan(state: GameState, seat: number, rng: () => number = Math.random): boolean {
  if (!state.lastDiscard) return false;
  const player = state.players[seat];
  if (player.isRiichi) return false;
  const tile = state.lastDiscard.tile;
  if (!canMinkan(player.hand, tile)) return false;

  const shantenBefore = calculateShanten(player.hand);
  const afterHand = bumpHand(player.hand, tile, -3);
  const shantenAfter = calculateShanten(afterHand);
  if (shantenAfter > shantenBefore) return false;
  return rng() < MINKAN_WILLINGNESS[player.aiLevel ?? 'normal'];
}

/**
 * 자기 차례에 안깡을 선언할지 결정한다. 부른다면 안깡할 패를,
 * 아니면 null을 반환한다. 리치 중에는 손패 형태를 바꾸지 않도록 안깡하지 않는다.
 */
export function decideAiAnkan(state: GameState, seat: number, rng: () => number = Math.random): number | null {
  const player = state.players[seat];
  if (player.isRiichi) return null;
  const candidates = findAnkanCandidates(player.hand);
  if (candidates.length === 0) return null;
  if (rng() >= ANKAN_WILLINGNESS[player.aiLevel ?? 'normal']) return null;
  return candidates[0];
}
