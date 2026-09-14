import type { Hand34 } from '../engine/types';

export type Difficulty = 'basic' | 'realistic';
export type AnswerType = 'single' | 'graded';
export type AnswerGrade = 'S' | 'A' | 'B';

export interface ProblemContext {
  turnCount: number;
  doraIndicators: number[];
  seatWind: number;
  roundWind: number;
  discardHistory?: number[][];
}

export interface GradedAnswer {
  tile: number;
  grade: AnswerGrade;
  reason: string;
}

export interface Problem {
  id: string;
  chapter: string;
  theoryTag: string[];
  difficulty: Difficulty;
  hand: Hand34;
  context?: ProblemContext;
  answerType: AnswerType;
  correctAnswer?: number;
  gradedAnswers?: GradedAnswer[];
  source: 'fixed' | 'generated';
}
