import type { Hand34, Meld } from '../engine/types';
import type { ScoreResult } from '../engine/scoring';

export type AiLevel = 'easy' | 'normal' | 'hard';

export interface PlayerState {
  seat: number; // 0~3, 자리 순서 (턴 순서와 동일)
  isHuman: boolean;
  aiLevel?: AiLevel;
  hand: Hand34;
  /** 치/퐁/깡으로 확정된 멘츠 (hand에는 포함되지 않는다) */
  melds: Meld[];
  discards: number[];
  isRiichi: boolean;
  score: number;
  /** 이번 판(국)에서의 자리바람 tile index (27~30) */
  seatWind: number;
}

export type GamePhase = 'draw' | 'discard' | 'reaction' | 'ended';

export interface WinInfo {
  type: 'tsumo' | 'ron';
  winnerSeat: number;
  loserSeat?: number; // ron일 때만
  score: ScoreResult;
}

export interface GameState {
  players: PlayerState[];
  wall: number[];
  doraIndicators: number[];
  roundWind: number;
  dealerSeat: number;
  currentSeat: number;
  turnCount: number;
  phase: GamePhase;
  /** 현재 차례 플레이어가 방금 벽에서 뽑은 패 (아직 버리지 않은 상태) */
  lastDraw?: number;
  lastDiscard?: { seat: number; tile: number };
  /**
   * 공탁된 리치 점수(1000점 단위 개수). 실물 점봉을 따로 두지 않고
   * 선언 시 즉시 플레이어 점수에서 차감한 뒤, 이 숫자로만 누적해 두었다가
   * 화료자가 나오면 그 점수에 합산한다(유국이면 다음 판으로 이월된다).
   */
  riichiSticks: number;
  result?: WinInfo | { type: 'draw' };
}
