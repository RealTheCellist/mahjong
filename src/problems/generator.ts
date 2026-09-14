import type { Hand34, RuleName } from '../engine/types';
import { calculateShanten } from '../engine/shanten';
import { gradeDiscardChoice } from '../engine/grading';
import type { Difficulty, GradedAnswer, Problem, ProblemContext } from './types';

// 텐파이(0샨텐)처럼 희귀한 목표 샨텐도 안정적으로 찾을 수 있도록 충분히 크게 잡는다
// (무작위 14장 손패가 텐파이일 확률은 약 0.1% 수준이다)
const MAX_DEAL_ATTEMPTS = 20000;

/** 34종 패 각 4장씩(136장) 벽에서 무작위로 tileCount장을 뽑는다 */
export function dealRandomHand(tileCount: number, rng: () => number = Math.random): Hand34 {
  const wall: number[] = [];
  for (let tile = 0; tile < 34; tile += 1) {
    for (let copy = 0; copy < 4; copy += 1) wall.push(tile);
  }
  for (let i = wall.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [wall[i], wall[j]] = [wall[j], wall[i]];
  }
  const hand = new Array(34).fill(0);
  for (let i = 0; i < tileCount; i += 1) {
    hand[wall[i]] += 1;
  }
  return hand;
}

/**
 * 지정한 샨텐 수를 만족하는 손패가 나올 때까지 무작위로 시도한다.
 * MAX_DEAL_ATTEMPTS 안에 찾지 못하면 마지막으로 뽑은 손패를 반환한다.
 */
export function generateHandWithShanten(
  targetShanten: number,
  tileCount: 13 | 14,
  ruleName: RuleName = 'Riichi',
  rng: () => number = Math.random,
): Hand34 {
  let hand = dealRandomHand(tileCount, rng);
  for (let attempt = 0; attempt < MAX_DEAL_ATTEMPTS; attempt += 1) {
    hand = dealRandomHand(tileCount, rng);
    if (calculateShanten(hand, ruleName) === targetShanten) return hand;
  }
  return hand;
}

function randomProblemId(chapter: string, rng: () => number): string {
  const suffix = Math.floor(rng() * 1e9).toString(36);
  return `${chapter}-${Date.now().toString(36)}-${suffix}`;
}

function generateRealisticContext(rng: () => number): ProblemContext {
  const winds = [27, 28, 29, 30]; // 1z~4z (동/남/서/북)
  return {
    turnCount: 1 + Math.floor(rng() * 12),
    doraIndicators: [Math.floor(rng() * 34)],
    seatWind: winds[Math.floor(rng() * winds.length)],
    roundWind: winds[Math.floor(rng() * 2)], // 보통 동장/남장
  };
}

export interface GenerateProblemOptions {
  chapter: string;
  theoryTag: string[];
  difficulty: Difficulty;
  /** 14장 손패 기준 목표 샨텐 수 (기본 1샨텐: 버림패 판단 훈련에 적합) */
  targetShanten?: number;
  ruleName?: RuleName;
  rng?: () => number;
}

/**
 * 나니키루(버림패 선택) 유형 문제를 임의 생성한다.
 * 손패는 무작위로 뽑되, 정답은 항상 룰 엔진(gradeDiscardChoice)으로 직접
 * 산출하므로 특정 문제집의 문제/해설을 베끼지 않는다.
 */
export function generateNanikiruProblem(options: GenerateProblemOptions): Problem {
  const { chapter, theoryTag, difficulty, targetShanten = 1, ruleName = 'Riichi', rng = Math.random } = options;

  const hand = generateHandWithShanten(targetShanten, 14, ruleName, rng);
  const grades = gradeDiscardChoice(hand, {}, ruleName);

  const gradedAnswers: GradedAnswer[] = [...grades.entries()].map(([tile, result]) => ({
    tile,
    grade: result.grade,
    reason: result.reason,
  }));

  return {
    id: randomProblemId(chapter, rng),
    chapter,
    theoryTag,
    difficulty,
    hand,
    context: difficulty === 'realistic' ? generateRealisticContext(rng) : undefined,
    answerType: 'graded',
    gradedAnswers,
    source: 'generated',
  };
}
