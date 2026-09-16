import { describe, expect, it } from 'vitest';
import {
  dealGame,
  drawTile,
  discardTile,
  canTsumo,
  canRon,
  isTenpaiAfterDiscard,
  applyTsumo,
  applyRon,
  currentPlayer,
  canCallPonOn,
  canCallKanOn,
  canCallChiOn,
  callPon,
  callChi,
  callMinkan,
  callAnkan,
  isFuriten,
  markRonDeclined,
} from '../gameEngine';
import { createEmptyHand34 } from '../../engine/types';
import { tileNameToIndex, tileNamesToHand34 } from '../../engine/tileCodec';
import type { GameState } from '../types';

const idx = tileNameToIndex;

function fixedRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

describe('dealGame', () => {
  it('딜러는 14장, 나머지는 13장을 받고 도라 표시패가 1장 있다', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(1) });
    expect(state.players[state.dealerSeat].hand.reduce((a, b) => a + b, 0)).toBe(14);
    for (const p of state.players) {
      if (p.seat !== state.dealerSeat) expect(p.hand.reduce((a, b) => a + b, 0)).toBe(13);
    }
    expect(state.doraIndicators.length).toBe(1);
    expect(state.phase).toBe('discard');
    expect(state.wall.length).toBe(136 - 13 * 4 - 1 - 1);
  });

  it('humanSeat과 aiLevels가 올바르게 배정된다', () => {
    const state = dealGame({ humanSeat: 2, aiLevels: ['easy', 'normal', 'hard'], rng: fixedRng(2) });
    expect(state.players[2].isHuman).toBe(true);
    expect(state.players[2].aiLevel).toBeUndefined();
    const aiPlayers = state.players.filter((p) => !p.isHuman);
    expect(aiPlayers.map((p) => p.aiLevel)).toEqual(['easy', 'normal', 'hard']);
  });
});

describe('drawTile', () => {
  it('현재 차례 플레이어의 손패가 1장 늘어난다', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(3) });
    const afterDiscard = discardTile(state, state.lastDraw as number);
    const before = afterDiscard.players[afterDiscard.currentSeat].hand.reduce((a, b) => a + b, 0);
    const drawn = drawTile(afterDiscard);
    const after = drawn.players[drawn.currentSeat].hand.reduce((a, b) => a + b, 0);
    expect(after).toBe(before + 1);
    expect(drawn.phase).toBe('discard');
  });

  it('벽이 비면 유국(draw) 처리한다', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(4) });
    const emptied: GameState = { ...state, wall: [] };
    const result = drawTile(emptied);
    expect(result.phase).toBe('ended');
    expect(result.result).toEqual({ type: 'draw' });
  });
});

describe('discardTile', () => {
  it('버린 패가 discards에 쌓이고 차례가 다음 사람에게 넘어간다', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(5) });
    const dealerSeat = state.dealerSeat;
    const tile = state.lastDraw as number;
    const next = discardTile(state, tile);
    expect(next.players[dealerSeat].discards).toContain(tile);
    expect(next.currentSeat).toBe((dealerSeat + 1) % 4);
    expect(next.phase).toBe('draw');
    expect(next.lastDiscard).toEqual({ seat: dealerSeat, tile });
  });

  it('리치 조건을 만족하고 declareRiichi를 지정하면 리치 처리 및 1000점 차감된다', () => {
    // 텐파이 상태의 손패를 강제로 세팅
    const tenpaiHand = tileNamesToHand34([
      '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s',
    ]);
    // 14번째 패를 하나 더해 버릴 수 있게 함 (필요없는 패)
    tenpaiHand[idx('1z')] = 1;
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(6) });
    const dealerSeat = state.dealerSeat;
    const rigged: GameState = {
      ...state,
      players: state.players.map((p) => (p.seat === dealerSeat ? { ...p, hand: tenpaiHand } : p)),
    };
    expect(isTenpaiAfterDiscard(tenpaiHand, idx('1z'))).toBe(true);
    const next = discardTile(rigged, idx('1z'), { declareRiichi: true });
    expect(next.players[dealerSeat].isRiichi).toBe(true);
    expect(next.players[dealerSeat].score).toBe(25000 - 1000);
  });

  it('텐파이가 아니면 declareRiichi를 요청해도 리치가 되지 않는다', () => {
    const notTenpaiHand = createEmptyHand34();
    // 완전히 흩어진 패 (텐파이와 거리가 먼 형태)
    ['1m', '4m', '7m', '1p', '4p', '7p', '1s', '4s', '7s', '1z', '3z', '5z', '7z'].forEach((n) => {
      notTenpaiHand[idx(n)] += 1;
    });
    notTenpaiHand[idx('9m')] = 1;
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(7) });
    const dealerSeat = state.dealerSeat;
    const rigged: GameState = {
      ...state,
      players: state.players.map((p) => (p.seat === dealerSeat ? { ...p, hand: notTenpaiHand } : p)),
    };
    const next = discardTile(rigged, idx('9m'), { declareRiichi: true });
    expect(next.players[dealerSeat].isRiichi).toBe(false);
    expect(next.players[dealerSeat].score).toBe(25000);
  });
});

describe('canTsumo / applyTsumo', () => {
  it('쯔모 가능한 손패라면 canTsumo가 true를 반환하고 applyTsumo로 점수가 이동한다', () => {
    const winningHand = tileNamesToHand34([
      '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s',
    ]);
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(8) });
    const dealerSeat = state.dealerSeat;
    const winTile = idx('8s');
    const rigged: GameState = {
      ...state,
      lastDraw: winTile,
      players: state.players.map((p) =>
        p.seat === dealerSeat ? { ...p, hand: (() => { const h = [...winningHand]; h[winTile] += 1; return h; })() } : p,
      ),
    };
    expect(canTsumo(rigged)).toBe(true);
    const result = applyTsumo(rigged);
    expect(result.phase).toBe('ended');
    expect(result.result?.type).toBe('tsumo');
    const totalScore = result.players.reduce((sum, p) => sum + p.score, 0);
    expect(totalScore).toBe(25000 * 4);
    expect(result.players[dealerSeat].score).toBeGreaterThan(25000);
  });
});

describe('canRon / applyRon', () => {
  it('론 가능한 손패라면 canRon이 true를 반환하고 applyRon으로 점수가 이동한다', () => {
    const tenpaiHand = tileNamesToHand34([
      '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s',
    ]);
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(9) });
    const dealerSeat = state.dealerSeat;
    const ronSeat = (dealerSeat + 1) % 4;
    const discardSeat = (dealerSeat + 3) % 4; // ronSeat 바로 이전 사람 (버림패 대상)
    const winTile = idx('8s');
    const rigged: GameState = {
      ...state,
      lastDiscard: { seat: discardSeat, tile: winTile },
      players: state.players.map((p) => (p.seat === ronSeat ? { ...p, hand: tenpaiHand } : p)),
    };
    expect(canRon(rigged, ronSeat)).toBe(true);
    const result = applyRon(rigged, ronSeat);
    expect(result.phase).toBe('ended');
    expect(result.result?.type).toBe('ron');
    const totalScore = result.players.reduce((sum, p) => sum + p.score, 0);
    expect(totalScore).toBe(25000 * 4);
    expect(result.players[ronSeat].score).toBeGreaterThan(25000);
    expect(result.players[discardSeat].score).toBeLessThan(25000);
  });

  it('자신이 버린 패로는 론을 할 수 없다', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(10) });
    const dealerSeat = state.dealerSeat;
    const rigged: GameState = { ...state, lastDiscard: { seat: dealerSeat, tile: idx('1m') } };
    expect(canRon(rigged, dealerSeat)).toBe(false);
  });
});

describe('후리텐', () => {
  const tenpaiHand = tileNamesToHand34([
    '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s',
  ]);

  it('자신의 대기패를 스스로 버렸으면 론을 할 수 없다(버림패 후리텐)', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(11) });
    const dealerSeat = state.dealerSeat;
    const ronSeat = (dealerSeat + 1) % 4;
    const discardSeat = (dealerSeat + 3) % 4;
    const winTile = idx('8s'); // 3s4s5s6s7s는 2s/5s/8s 삼면대기
    const rigged: GameState = {
      ...state,
      lastDiscard: { seat: discardSeat, tile: winTile },
      players: state.players.map((p) =>
        p.seat === ronSeat ? { ...p, hand: tenpaiHand, discards: [idx('5s')] } : p,
      ),
    };
    expect(isFuriten(rigged, ronSeat)).toBe(true);
    expect(canRon(rigged, ronSeat)).toBe(false);
  });

  it('론 기회를 넘기면(동첨 후리텐) 이후 같은 국면에서 론을 할 수 없다', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(12) });
    const dealerSeat = state.dealerSeat;
    const ronSeat = (dealerSeat + 1) % 4;
    const discardSeat = (dealerSeat + 3) % 4;
    const winTile = idx('8s');
    const rigged: GameState = {
      ...state,
      lastDiscard: { seat: discardSeat, tile: winTile },
      players: state.players.map((p) => (p.seat === ronSeat ? { ...p, hand: tenpaiHand } : p)),
    };
    expect(canRon(rigged, ronSeat)).toBe(true);

    const declined = markRonDeclined(rigged, ronSeat);
    expect(isFuriten(declined, ronSeat)).toBe(true);
    expect(canRon(declined, ronSeat)).toBe(false);
  });

  it('리치 중이 아니면 자기 차례에 새로 드로우하면 동첨 후리텐이 풀린다', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(13) });
    const seat = state.currentSeat;
    const withFuriten: GameState = {
      ...state,
      players: state.players.map((p) => (p.seat === seat ? { ...p, missedRonFuriten: true } : p)),
    };
    // 자기 차례가 아니면 풀리지 않는다
    const otherSeat = (seat + 1) % 4;
    const stateForOther: GameState = {
      ...withFuriten,
      currentSeat: otherSeat,
      players: withFuriten.players.map((p) => (p.seat === otherSeat ? { ...p, missedRonFuriten: false } : p)),
    };
    const drawnForOther = drawTile(stateForOther);
    expect(drawnForOther.players[seat].missedRonFuriten).toBe(true); // 다른 사람 드로우로는 안 풀림

    const drawn = drawTile(withFuriten);
    expect(drawn.players[seat].missedRonFuriten).toBe(false);
  });

  it('리치 중이면 자기 차례에 드로우해도 동첨 후리텐이 풀리지 않는다', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(14) });
    const seat = state.currentSeat;
    const withFuriten: GameState = {
      ...state,
      players: state.players.map((p) => (p.seat === seat ? { ...p, isRiichi: true, missedRonFuriten: true } : p)),
    };
    const drawn = drawTile(withFuriten);
    expect(drawn.players[seat].missedRonFuriten).toBe(true);
  });
});

describe('리치 공탁금(riichiSticks)', () => {
  it('리치 선언 시 개인 점수가 아닌 공탁 카운트로 누적된다', () => {
    const tenpaiHand = tileNamesToHand34([
      '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s',
    ]);
    tenpaiHand[idx('1z')] = 1;
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(50) });
    const dealerSeat = state.dealerSeat;
    const rigged: GameState = {
      ...state,
      players: state.players.map((p) => (p.seat === dealerSeat ? { ...p, hand: tenpaiHand } : p)),
    };
    expect(rigged.riichiSticks).toBe(0);
    const next = discardTile(rigged, idx('1z'), { declareRiichi: true });
    expect(next.riichiSticks).toBe(1);
    expect(next.players[dealerSeat].score).toBe(25000 - 1000);
  });

  it('화료자가 공탁된 리치 점수를 모두 가져가고 공탁은 0으로 초기화된다', () => {
    const tenpaiHand = tileNamesToHand34([
      '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s',
    ]);
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(51) });
    const dealerSeat = state.dealerSeat;
    const ronSeat = (dealerSeat + 1) % 4;
    const discardSeat = (dealerSeat + 3) % 4;
    const winTile = idx('8s');
    const rigged: GameState = {
      ...state,
      riichiSticks: 2, // 다른 두 명이 이미 리치를 선언해 공탁이 2000점 쌓여 있다고 가정
      lastDiscard: { seat: discardSeat, tile: winTile },
      players: state.players.map((p) => (p.seat === ronSeat ? { ...p, hand: tenpaiHand } : p)),
    };
    const before = rigged.players[ronSeat].score;
    const result = applyRon(rigged, ronSeat);
    expect(result.riichiSticks).toBe(0);
    if (result.result?.type !== 'ron') throw new Error('ron 결과가 아닙니다');
    const { payments } = result.result.score;
    if (payments.type !== 'ron') throw new Error('ron 지급 타입이 아닙니다');
    // 화료 점수(론 지급분) + 공탁 2000점이 모두 승자에게 더해진다
    expect(result.players[ronSeat].score).toBe(before + payments.loserPays + 2000);
  });
});

describe('콜 액션 (치/퐁/깡)', () => {
  it('손패에 2장 있으면 퐁을 부를 수 있다', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(20) });
    const dealerSeat = state.dealerSeat;
    const tile = state.lastDraw as number;
    const ponSeat = (dealerSeat + 1) % 4;
    const withExtra: GameState = {
      ...state,
      players: state.players.map((p) => (p.seat === ponSeat ? { ...p, hand: (() => { const h = [...p.hand]; h[tile] = Math.max(h[tile], 2); return h; })() } : p)),
    };
    const afterDiscard = discardTile(withExtra, tile);
    expect(canCallPonOn(afterDiscard, ponSeat)).toBe(true);

    const ponned = callPon(afterDiscard, ponSeat);
    expect(ponned.players[ponSeat].melds).toEqual([{ type: 'kotsu', tiles: [tile, tile, tile], isOpen: true }]);
    expect(ponned.players[ponSeat].hand[tile]).toBe(0);
    expect(ponned.currentSeat).toBe(ponSeat);
    expect(ponned.phase).toBe('discard');
  });

  it('직전 사람이 버린 패는 다음 차례 플레이어가 치를 부를 수 있다', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(21) });
    const dealerSeat = state.dealerSeat;
    const chiSeat = (dealerSeat + 1) % 4;
    const tile = idx('5s');
    const rigged: GameState = {
      ...state,
      players: state.players.map((p) => {
        if (p.seat === dealerSeat) {
          const h = [...p.hand];
          h[tile] += 1;
          return { ...p, hand: h };
        }
        if (p.seat === chiSeat) {
          const h = [...p.hand];
          h[idx('4s')] += 1;
          h[idx('6s')] += 1;
          return { ...p, hand: h };
        }
        return p;
      }),
    };
    const afterDiscard = discardTile(rigged, tile);
    const options = canCallChiOn(afterDiscard, chiSeat);
    expect(options).toEqual(expect.arrayContaining([[idx('4s'), idx('6s')]]));

    const chiied = callChi(afterDiscard, chiSeat, [idx('4s'), idx('6s')]);
    expect(chiied.players[chiSeat].melds).toEqual([
      { type: 'shuntsu', tiles: [idx('4s'), idx('5s'), idx('6s')], isOpen: true },
    ]);
    expect(chiied.currentSeat).toBe(chiSeat);
    expect(chiied.phase).toBe('discard');
  });

  it('건너뛴 자리(맞은편 등)는 치를 부를 수 없다', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(22) });
    const dealerSeat = state.dealerSeat;
    const acrossSeat = (dealerSeat + 2) % 4;
    const tile = state.lastDraw as number;
    const afterDiscard = discardTile(state, tile);
    expect(canCallChiOn(afterDiscard, acrossSeat)).toEqual([]);
  });

  it('밍깡: 손패 3장 + 버림패 1장으로 깡을 만들고 보충패를 뽑는다', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(23) });
    const dealerSeat = state.dealerSeat;
    const kanSeat = (dealerSeat + 1) % 4;
    const tile = state.lastDraw as number;
    const withTriplet: GameState = {
      ...state,
      players: state.players.map((p) => (p.seat === kanSeat ? { ...p, hand: (() => { const h = [...p.hand]; h[tile] = 3; return h; })() } : p)),
    };
    const afterDiscard = discardTile(withTriplet, tile);
    expect(canCallKanOn(afterDiscard, kanSeat)).toBe(true);

    const kanned = callMinkan(afterDiscard, kanSeat);
    expect(kanned.players[kanSeat].melds).toEqual([{ type: 'kantsu', tiles: [tile, tile, tile, tile], isOpen: true }]);
    expect(kanned.players[kanSeat].hand[tile]).toBe(0);
    expect(kanned.lastDraw).toBeDefined();
    expect(kanned.doraIndicators.length).toBe(2);
    expect(kanned.phase).toBe('discard');
    expect(kanned.currentSeat).toBe(kanSeat);
  });

  it('안깡: 자기 차례에 4장을 모아 선언하면 손패에서 빠지고 보충패를 뽑는다', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(24) });
    const dealerSeat = state.dealerSeat;
    const tile = idx('9m');
    const rigged: GameState = {
      ...state,
      players: state.players.map((p) => {
        if (p.seat !== dealerSeat) return p;
        const h = [...p.hand];
        h[tile] = 4;
        return { ...p, hand: h };
      }),
    };
    const ankanned = callAnkan(rigged, tile);
    expect(ankanned.players[dealerSeat].melds).toEqual([
      { type: 'kantsu', tiles: [tile, tile, tile, tile], isOpen: false },
    ]);
    expect(ankanned.players[dealerSeat].hand[tile]).toBe(0);
    expect(ankanned.doraIndicators.length).toBe(2);
    expect(ankanned.currentSeat).toBe(dealerSeat);
    expect(ankanned.phase).toBe('discard');
  });

  it('산이 다 떨어진 상태에서 깡을 하면 유국 처리된다', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(25) });
    const dealerSeat = state.dealerSeat;
    const tile = idx('9m');
    const rigged: GameState = {
      ...state,
      wall: [],
      players: state.players.map((p) => {
        if (p.seat !== dealerSeat) return p;
        const h = [...p.hand];
        h[tile] = 4;
        return { ...p, hand: h };
      }),
    };
    const result = callAnkan(rigged, tile);
    expect(result.phase).toBe('ended');
    expect(result.result).toEqual({ type: 'draw' });
  });
});

describe('currentPlayer', () => {
  it('현재 차례 플레이어를 반환한다', () => {
    const state = dealGame({ aiLevels: ['easy', 'easy', 'easy'], rng: fixedRng(11) });
    expect(currentPlayer(state).seat).toBe(state.currentSeat);
  });
});
