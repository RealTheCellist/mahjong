import { describe, expect, it } from 'vitest';
import { gradeDiscardChoice } from '../grading';
import { tileNameToIndex, tileNamesToHand34 } from '../tileCodec';

const idx = tileNameToIndex;

describe('gradeDiscardChoice', () => {
  const hand = tileNamesToHand34([
    '1m', '1m', '1m', '6p', '7p', '7p', '1s', '1s', '2s',
    '5s', '5s', '1z', '1z', '1z',
  ]);
  const grades = gradeDiscardChoice(hand);

  it('최대 유효패를 갖는 버림(7p, 1s)은 S등급이다', () => {
    expect(grades.get(idx('7p'))?.grade).toBe('S');
    expect(grades.get(idx('1s'))?.grade).toBe('S');
  });

  it('중간 수준 버림(2s)은 A등급이다', () => {
    expect(grades.get(idx('2s'))?.grade).toBe('A');
  });

  it('효율이 낮은 버림(1m)은 B등급이다', () => {
    expect(grades.get(idx('1m'))?.grade).toBe('B');
  });

  it('샨텐이 후퇴하는 버림(5s)은 항상 B등급이며 악수 이유를 포함한다', () => {
    const result = grades.get(idx('5s'));
    expect(result?.grade).toBe('B');
    expect(result?.reason).toContain('후퇴');
  });

  it('반환된 모든 항목은 ukeire 수치를 포함한다', () => {
    for (const result of grades.values()) {
      expect(typeof result.ukeire).toBe('number');
      expect(result.ukeire).toBeGreaterThanOrEqual(0);
    }
  });
});
