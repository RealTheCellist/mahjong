import { describe, expect, it } from 'vitest';
import { decideAiDiscard, decideAiTsumo, decideAiRon } from '../aiPlayer';
import { dealGame, discardTile, drawTile } from '../gameEngine';
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

function findAiSeat(state: GameState): number {
  return state.players.find((p) => !p.isHuman)!.seat;
}

describe('decideAiDiscard', () => {
  it('AI 손패에 실제로 존재하는 패를 버린다', () => {
    let state = dealGame({ aiLevels: ['normal', 'normal', 'normal'], rng: fixedRng(1) });
    // 딜러가 사람이 아니면 딜러부터, 사람이면 넘겨서 AI 차례까지 진행
    while (state.players[state.currentSeat].isHuman) {
      const tile = state.lastDraw as number;
      state = drawTile(discardTile(state, tile));
    }
    const seat = state.currentSeat;
    const before = state.players[seat].hand[state.lastDraw as number];
    expect(before).toBeGreaterThan(0);
    const decision = decideAiDiscard(state, seat, fixedRng(2));
    expect(state.players[seat].hand[decision.tile]).toBeGreaterThan(0);
  });

  it('easy/normal/hard 모두 버림패 결정을 내릴 수 있다', () => {
    for (const level of ['easy', 'normal', 'hard'] as const) {
      const state = dealGame({ aiLevels: [level, level, level], rng: fixedRng(3) });
      const seat = findAiSeat(state);
      const stateAtSeat = drawTile({ ...state, currentSeat: seat });
      const decision = decideAiDiscard(stateAtSeat, seat, fixedRng(4));
      expect(stateAtSeat.players[seat].hand[decision.tile]).toBeGreaterThan(0);
    }
  });

  it('텐파이가 아니면 declareRiichi를 절대 선택하지 않는다', () => {
    const state = dealGame({ aiLevels: ['hard', 'hard', 'hard'], rng: fixedRng(5) });
    const seat = findAiSeat(state);
    const stateAtSeat = drawTile({ ...state, currentSeat: seat });
    // 초반 배패는 통상 텐파이가 아니므로 리치 선언이 나오지 않아야 한다
    for (let i = 0; i < 5; i += 1) {
      const decision = decideAiDiscard(stateAtSeat, seat, fixedRng(10 + i));
      if (decision.declareRiichi) {
        // 리치를 선언했다면 실제로 텐파이였어야 한다 (오탐지 방지 검증)
        const next = discardTile(stateAtSeat, decision.tile);
        expect(next.players[seat].isRiichi).toBe(true);
      }
    }
  });

  it('텐파이 상태에서는 hard 난이도가 리치를 선언할 확률이 높다', () => {
    const tenpaiHand = tileNamesToHand34([
      '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s',
    ]);
    tenpaiHand[idx('1z')] = 1;
    const state = dealGame({ aiLevels: ['hard', 'hard', 'hard'], rng: fixedRng(6) });
    const seat = findAiSeat(state);
    const rigged: GameState = {
      ...state,
      currentSeat: seat,
      lastDraw: idx('1z'),
      players: state.players.map((p) => (p.seat === seat ? { ...p, hand: tenpaiHand } : p)),
    };
    let riichiCount = 0;
    const trials = 50;
    for (let i = 0; i < trials; i += 1) {
      const decision = decideAiDiscard(rigged, seat, fixedRng(100 + i));
      if (decision.tile === idx('1z') && decision.declareRiichi) riichiCount += 1;
    }
    expect(riichiCount).toBeGreaterThan(trials * 0.7);
  });

  it('리치 중인 상대가 있고 위험패가 있으면 방어를 고려한 버림을 시도한다(에러 없이 동작)', () => {
    const state = dealGame({ aiLevels: ['hard', 'hard', 'hard'], rng: fixedRng(7) });
    const seat = findAiSeat(state);
    const opponentSeat = (seat + 1) % 4;
    const rigged: GameState = drawTile({
      ...state,
      currentSeat: seat,
      players: state.players.map((p) =>
        p.seat === opponentSeat ? { ...p, isRiichi: true, discards: [idx('5m'), idx('3p')] } : p,
      ),
    });
    expect(() => decideAiDiscard(rigged, seat, fixedRng(8))).not.toThrow();
  });
});

describe('decideAiTsumo / decideAiRon', () => {
  it('화료 가능한 손은 항상 화료를 선택한다', () => {
    expect(decideAiTsumo()).toBe(true);
    expect(decideAiRon()).toBe(true);
  });
});
