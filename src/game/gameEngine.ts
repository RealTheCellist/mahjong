import { createEmptyHand34 } from '../engine/types';
import type { Hand34, Meld } from '../engine/types';
import { calculateShanten } from '../engine/shanten';
import { checkYaku } from '../engine/yaku';
import { calculateScore, type ScoreResult } from '../engine/scoring';
import { canPon, canMinkan, getChiOptions } from '../engine/calls';
import { isDiscardFuriten } from '../engine/waits';
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
    melds: [],
    discards: [],
    isRiichi: false,
    score: STARTING_SCORE,
    seatWind: windForSeat(seat, dealerSeat),
    missedRonFuriten: false,
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
    riichiSticks: 0,
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
    p.seat === state.currentSeat
      ? { ...p, hand: bumpHand(p.hand, tile, 1), missedRonFuriten: p.isRiichi ? p.missedRonFuriten : false }
      : p,
  );
  return { ...state, wall: restWall, players, phase: 'discard', lastDraw: tile };
}

export function bumpHand(hand: Hand34, tile: number, delta: number): Hand34 {
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
      melds: player.melds,
    });
    return yaku.length > 0;
  } catch {
    return false;
  }
}

/** 특정 자리 플레이어가 방금 버려진 패로 론 화료가 가능한지 확인한다 */
/** seat가 현재 후리텐 상태인지(버림패 후리텐 또는 론을 놓쳐서 걸린 후리텐) 확인한다 */
export function isFuriten(state: GameState, seat: number): boolean {
  const player = state.players[seat];
  return player.missedRonFuriten || isDiscardFuriten(player.hand, player.discards);
}

/** seat의 론 기회를 놓쳤음을 기록한다(동첨 후리텐). 리치 중이면 이번 판이 끝날 때까지 유지된다 */
export function markRonDeclined(state: GameState, seat: number): GameState {
  const players = state.players.map((p) => (p.seat === seat ? { ...p, missedRonFuriten: true } : p));
  return { ...state, players };
}

export function canRon(state: GameState, seat: number): boolean {
  if (!state.lastDiscard || state.lastDiscard.seat === seat) return false;
  if (isFuriten(state, seat)) return false;
  const player = state.players[seat];
  const testHand = bumpHand(player.hand, state.lastDiscard.tile, 1);
  try {
    const yaku = checkYaku(testHand, {
      winTile: state.lastDiscard.tile,
      isTsumo: false,
      isRiichi: player.isRiichi,
      seatWind: player.seatWind,
      roundWind: state.roundWind,
      melds: player.melds,
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
    riichiSticks: willRiichi ? state.riichiSticks + 1 : state.riichiSticks,
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

/** 공탁된 리치 점수(점봉 없이 숫자로만 누적)를 화료자에게 지급한다 */
function payoutRiichiSticks(players: PlayerState[], winnerSeat: number, riichiSticks: number): PlayerState[] {
  if (riichiSticks === 0) return players;
  return players.map((p) => (p.seat === winnerSeat ? { ...p, score: p.score + riichiSticks * RIICHI_STICK } : p));
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
    melds: winner.melds,
  });
  const players = payoutRiichiSticks(
    applyPayments(state.players, winner.seat, state.dealerSeat, score),
    winner.seat,
    state.riichiSticks,
  );
  return {
    ...state,
    players,
    phase: 'ended',
    result: { type: 'tsumo', winnerSeat: winner.seat, score },
    riichiSticks: 0,
  };
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
    melds: winner.melds,
  });
  const players = payoutRiichiSticks(
    applyPayments(state.players, winner.seat, state.dealerSeat, score, state.lastDiscard.seat),
    winner.seat,
    state.riichiSticks,
  );
  return {
    ...state,
    players,
    phase: 'ended',
    riichiSticks: 0,
    result: { type: 'ron', winnerSeat: winner.seat, loserSeat: state.lastDiscard.seat, score },
  };
}

// ---------------------------------------------------------------------------
// 콜 액션 (치/퐁/깡)
//
// 밍깡/안깡의 보충패와 새 도라 표시패는 별도의 사왕패(死牌)를 모델링하지 않고
// wall의 끝에서 pop()해 충당한다(첫 도라 표시패도 동일한 방식이다). 실전보다
// 산패가 조금 더 빨리 줄어들지만 1인 연습 게임에서는 무시할 수 있는 차이다.
// ---------------------------------------------------------------------------

/** seat가 현재 버려진 패로 퐁을 부를 수 있는지 */
export function canCallPonOn(state: GameState, seat: number): boolean {
  if (!state.lastDiscard || state.lastDiscard.seat === seat) return false;
  return canPon(state.players[seat].hand, state.lastDiscard.tile);
}

/** seat가 현재 버려진 패로 밍깡을 부를 수 있는지 */
export function canCallKanOn(state: GameState, seat: number): boolean {
  if (!state.lastDiscard || state.lastDiscard.seat === seat) return false;
  return canMinkan(state.players[seat].hand, state.lastDiscard.tile);
}

/** seat가 현재 버려진 패로 치를 부를 수 있는지 (버림패 바로 다음 차례만 가능) */
export function canCallChiOn(state: GameState, seat: number): [number, number][] {
  if (!state.lastDiscard || state.lastDiscard.seat === seat) return [];
  if (seat !== (state.lastDiscard.seat + 1) % 4) return [];
  return getChiOptions(state.players[seat].hand, state.lastDiscard.tile);
}

/** seat가 버려진 패로 퐁을 선언한다. 이후 해당 seat가 버림 차례를 갖는다 */
export function callPon(state: GameState, seat: number): GameState {
  if (!state.lastDiscard) throw new Error('울 수 있는 버림패가 없습니다');
  const tile = state.lastDiscard.tile;
  const meld: Meld = { type: 'kotsu', tiles: [tile, tile, tile], isOpen: true };
  const players = state.players.map((p) =>
    p.seat === seat
      ? { ...p, hand: bumpHand(p.hand, tile, -2), melds: [...p.melds, meld] }
      : p,
  );
  return {
    ...state,
    players,
    currentSeat: seat,
    phase: 'discard',
    lastDraw: undefined,
    lastDiscard: undefined,
    turnCount: state.turnCount + 1,
  };
}

/** seat가 버려진 패와 손패 두 장으로 치를 선언한다. 이후 해당 seat가 버림 차례를 갖는다 */
export function callChi(state: GameState, seat: number, chiTiles: [number, number]): GameState {
  if (!state.lastDiscard) throw new Error('울 수 있는 버림패가 없습니다');
  const tile = state.lastDiscard.tile;
  const meld: Meld = { type: 'shuntsu', tiles: [...chiTiles, tile].sort((a, b) => a - b), isOpen: true };
  const players = state.players.map((p) =>
    p.seat === seat
      ? { ...p, hand: bumpHand(bumpHand(p.hand, chiTiles[0], -1), chiTiles[1], -1), melds: [...p.melds, meld] }
      : p,
  );
  return {
    ...state,
    players,
    currentSeat: seat,
    phase: 'discard',
    lastDraw: undefined,
    lastDiscard: undefined,
    turnCount: state.turnCount + 1,
  };
}

/** 깡 선언 후 보충패를 뽑고 새 도라 표시패를 하나 추가한다. 산이 없으면 유국 처리한다 */
function drawKanReplacement(state: GameState, hand: Hand34, meld: Meld, seat: number): GameState {
  const wall = [...state.wall];
  const replacement = wall.pop();
  const newDoraIndicator = wall.pop();
  const doraIndicators =
    newDoraIndicator !== undefined ? [...state.doraIndicators, newDoraIndicator] : state.doraIndicators;

  if (replacement === undefined) {
    const players = state.players.map((p) => (p.seat === seat ? { ...p, hand, melds: [...p.melds, meld] } : p));
    return { ...state, players, wall, doraIndicators, phase: 'ended', result: { type: 'draw' } };
  }

  const finalHand = bumpHand(hand, replacement, 1);
  const players = state.players.map((p) =>
    p.seat === seat ? { ...p, hand: finalHand, melds: [...p.melds, meld] } : p,
  );
  return {
    ...state,
    players,
    wall,
    doraIndicators,
    currentSeat: seat,
    phase: 'discard',
    lastDraw: replacement,
    lastDiscard: undefined,
  };
}

/** seat가 버려진 패로 밍깡(공개 깡)을 선언한다 */
export function callMinkan(state: GameState, seat: number): GameState {
  if (!state.lastDiscard) throw new Error('울 수 있는 버림패가 없습니다');
  const tile = state.lastDiscard.tile;
  const player = state.players[seat];
  const meld: Meld = { type: 'kantsu', tiles: [tile, tile, tile, tile], isOpen: true };
  const hand = bumpHand(player.hand, tile, -3);
  return drawKanReplacement(state, hand, meld, seat);
}

/** 현재 차례 플레이어가 자신의 손패로 안깡(비공개 깡)을 선언한다 */
export function callAnkan(state: GameState, tile: number): GameState {
  const seat = state.currentSeat;
  const player = state.players[seat];
  if (state.phase !== 'discard' || player.hand[tile] < 4) {
    throw new Error('안깡을 선언할 수 없습니다');
  }
  const meld: Meld = { type: 'kantsu', tiles: [tile, tile, tile, tile], isOpen: false };
  const hand = bumpHand(player.hand, tile, -4);
  return drawKanReplacement(state, hand, meld, seat);
}
