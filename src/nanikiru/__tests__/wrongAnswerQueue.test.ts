import { describe, expect, it, beforeEach } from 'vitest';
import { addWrongAnswer, clearWrongAnswers, getWrongAnswers } from '../wrongAnswerQueue';
import { FIXED_PROBLEMS } from '../fixedProblems';

describe('wrongAnswerQueue', () => {
  beforeEach(() => {
    clearWrongAnswers();
  });

  it('처음에는 비어있다', () => {
    expect(getWrongAnswers()).toHaveLength(0);
  });

  it('추가하면 최신 항목이 맨 앞에 온다', () => {
    addWrongAnswer({ problem: FIXED_PROBLEMS[0], chosenTile: 0, grade: 'B', reason: 'r1' });
    addWrongAnswer({ problem: FIXED_PROBLEMS[1], chosenTile: 1, grade: 'A', reason: 'r2' });
    const all = getWrongAnswers();
    expect(all).toHaveLength(2);
    expect(all[0].reason).toBe('r2');
  });

  it('clearWrongAnswers로 비울 수 있다', () => {
    addWrongAnswer({ problem: FIXED_PROBLEMS[0], chosenTile: 0, grade: 'B', reason: 'r1' });
    clearWrongAnswers();
    expect(getWrongAnswers()).toHaveLength(0);
  });
});
