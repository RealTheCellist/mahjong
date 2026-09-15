import { createEmptyHand34 } from '../engine/types';
import type { Hand34 } from '../engine/types';
import { calculateShanten } from '../engine/shanten';
import { checkYaku } from '../engine/yaku';
import { calculateScore, type ScoreResult } from '../engine/scoring';
import type { AiLevel, GameState, PlayerState } from './types';

const RIICHI_STICK = 1000;
const STARTING_SCORE = 25000;
const HAND_SIZE = 13;

function shuffledWall(rng: () => number): number[] {
  const wall: number[] = [];
  for (let tile = 0; tile < 34; tile += 1) {
    for (let copy = 0; copy < 4; copy += 1) wall.push(tile);
  }
  for (let i = wall.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [wall[i], wall[j]] = [wall[j], wall[i]];
  }
  return wall;
}

function handFromTiles(tiles: number[]): Hand34 {
  const hand = createEmptyHand34();
  for (const t of tiles) hand[t] += 1;
  return hand;
}

/** dealerSeat 기준 상대적 자리바람: 딜러=동, 이후 남/서/북 순 */
function windForSeat(seat: number, dealerSeat: number): number {
  const offset = (seat - dealerSeat + 4) % 4;
  return 27 + offset; // 27=동, 28=남, 29=서, 30=북
}

export interface DealOptions {
  humanSeat?: number;
  aiLevels: [AiLevel, AiLevel, AiLevel];
  dealerSeat?: number;
  rng?: () => number;
}

/** 새 판(국)을 딜러 시점까지 딜링한다 (딜러는 14장, 나머지는 13장) */
export function dealGame(options: DealOptions): GameState {
  const { humanSeat = 0, aiLevels, dealerSeat = 0, rng = Math.random } = options;
  const wall = shuffledWall(rng);

  const hands: number[][] = [[], [], [], []];
  for (let seat = 0; seat < 4; seat += 1) {
    hands[seat] = wall.splice(0, HAND_SIZE);
  }
  const doraIndicators = [wall.pop() as number];

  let aiIndex = 0;
  const players: PlayerState[] = Array.from({ length: 4 }, (_, seat) => ({
    seat,
    isHuman: seat === humanSeat,
    aiLevel: seat === humanSeat ? undefined : aiLevels[aiIndex++],
    hand: handFromTiles(hands[seat]),
    discards: [],
    isRiichi: false,
    score: STARTING_SCORE,
    seatWind: windForSeat(seat, dealerSeat),
  }));

  const state: GameState = {
    players,
    wall,
    doraIndicators,
    roundWind: 27,
    dealerSeat,
    currentSeat: dealerSeat,
    turnCount: 1,
    phase: 'draw',
  };

  return drawTile(state);
}

/** 현재 차례인 플레이어가 벽에서 한 장을 뽑는다. 벽이 비면 유국 처리한다. */
export function drawTile(state: GameState): GameState {
  if (state.wall.length === 0) {
    return { ...state, phase: 'ended', result: { type: 'draw' } };
  }
  const [tile, ...restWall] = state.wall;
  const players = state.players.map((p) =>
    p.seat === state.currentSeat ? { ...p, hand: bumpHand(p.hand, tile, 1) } : p,
  );
  return { ...state, wall: restWall, players, phase: 'discard', lastDraw: tile };
}

function bumpHand(hand: Hand34, tile: number, delta: number): Hand34 {
  const next = [...hand];
  next[tile] += delta;
  return next;
}

export function currentPlayer(state: GameState): PlayerState {
  return state.players[state.currentSeat];
}

/** 방금 뽑은 패로 쯔모 화료가 가능한지 확인한다 */
export function canTsumo(state: GameState): boolean {
  if (state.phase !== 'discard' || state.lastDraw === undefined) return false;
  const player = currentPlayer(state);
  try {
    const yaku = checkYaku(player.hand, {
      winTile: state.lastDraw,
      isTsumo: true,
      isRiichi: player.isRiichi,
      seatWind: player.seatWind,
      roundWind: state.roundWind,
    });
    return yaku.length > 0;
  } catch {
    return false;
  }
}

/** 특정 자리 플레이어가 방금 버려진 패로 론 화료가 가능한지 확인한다 */
export function canRon(state: GameState, seat: number): boolean {
  if (!state.lastDiscard || state.lastDiscard.seat === seat) return false;
  const player = state.players[seat];
  const testHand = bumpHand(player.hand, state.lastDiscard.tile, 1);
  try {
    const yaku = checkYaku(testHand, {
      winTile: state.lastDiscard.tile,
      isTsumo: false,
      isRiichi: player.isRiichi,
      seatWind: player.seatWind,
      roundWind: state.roundWind,
    });
    return yaku.length > 0;
  } catch {
    return false;
  }
}

/** 현재 14장 손패에서 discardCandidate를 버렸을 때 텐파이가 되는지 확인한다 (리치 가능 여부 판단용) */
export function isTenpaiAfterDiscard(hand: Hand34, discardCandidate: number): boolean {
  const next = bumpHand(hand, discardCandidate, -1);
  return calculateShanten(next) === 0;
}

export interface DiscardOptions {
  declareRiichi?: boolean;
}

/** 현재 차례 플레이어가 패를 버린다. declareRiichi가 true면 리치 조건을 만족할 때만 리치 처리한다 */
export function discardTile(state: GameState, tile: number, options: DiscardOptions = {}): GameState {
  const player = currentPlayer(state);
  const canDeclareRiichi =
    !player.isRiichi && player.score >= RIICHI_STICK && isTenpaiAfterDiscard(player.hand, tile);
  const willRiichi = Boolean(options.declareRiichi) && canDeclareRiichi;

  const players = state.players.map((p) => {
    if (p.seat !== state.currentSeat) return p;
    return {
      ...p,
      hand: bumpHand(p.hand, tile, -1),
      discards: [...p.discards, tile],
      isRiichi: p.isRiichi || willRiichi,
      score: willRiichi ? p.score - RIICHI_STICK : p.score,
    };
  });

  const nextSeat = (state.currentSeat + 1) % 4;
  return {
    ...state,
    players,
    lastDiscard: { seat: state.currentSeat, tile },
    lastDraw: undefined,
    currentSeat: nextSeat,
    phase: 'draw',
    turnCount: state.turnCount + 1,
  };
}

function applyPayments(
  players: PlayerState[],
  winnerSeat: number,
  dealerSeat: number,
  score: ScoreResult,
  loserSeat?: number,
) {
  return players.map((p) => {
    if (score.payments.type === 'ron') {
      if (p.seat === winnerSeat) return { ...p, score: p.score + score.payments.loserPays };
      if (p.seat === loserSeat) return { ...p, score: p.score - score.payments.loserPays };
      return p;
    }
    if (score.payments.type === 'tsumo-dealer') {
      if (p.seat === winnerSeat) return { ...p, score: p.score + score.payments.eachNonDealerPays * 3 };
      return { ...p, score: p.score - score.payments.eachNonDealerPays };
    }
    // tsumo-nondealer
    if (p.seat === winnerSeat) {
      return { ...p, score: p.score + score.payments.dealerPays + score.payments.eachOtherNonDealerPays * 2 };
    }
    if (p.seat === dealerSeat) return { ...p, score: p.score - score.payments.dealerPays };
    return { ...p, score: p.score - score.payments.eachOtherNonDealerPays };
  });
}

/** 쯔모 화료를 확정한다 */
export function applyTsumo(state: GameState): GameState {
  const winner = currentPlayer(state);
  if (state.lastDraw === undefined) throw new Error('쯔모 대상 패가 없습니다');
  const score = calculateScore(winner.hand, {
    winTile: state.lastDraw,
    isTsumo: true,
    isDealer: winner.seat === state.dealerSeat,
    isRiichi: winner.isRiichi,
    seatWind: winner.seatWind,
    roundWind: state.roundWind,
    doraIndicators: state.doraIndicators,
  });
  const players = applyPayments(state.players, winner.seat, state.dealerSeat, score);
  return { ...state, players, phase: 'ended', result: { type: 'tsumo', winnerSeat: winner.seat, score } };
}

/** ronSeat 플레이어의 론 화료를 확정한다 */
export function applyRon(state: GameState, ronSeat: number): GameState {
  if (!state.lastDiscard) throw new Error('론 대상 버림패가 없습니다');
  const winner = state.players[ronSeat];
  const winHand = bumpHand(winner.hand, state.lastDiscard.tile, 1);
  const score = calculateScore(winHand, {
    winTile: state.lastDiscard.tile,
    isTsumo: false,
    isDealer: winner.seat === state.dealerSeat,
    isRiichi: winner.isRiichi,
    seatWind: winner.seatWind,
    roundWind: state.roundWind,
    doraIndicators: state.doraIndicators,
  });
  const players = applyPayments(state.players, winner.seat, state.dealerSeat, score, state.lastDiscard.seat);
  return {
    ...state,
    players,
    phase: 'ended',
    result: { type: 'ron', winnerSeat: winner.seat, loserSeat: state.lastDiscard.seat, score },
  };
}
