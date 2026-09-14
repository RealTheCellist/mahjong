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

  it('방어 국면(requiresDefense)에서는 효율이 좋아도 위험패면 B로 강등된다', () => {
    // 7p는 상대 버림패에 없고 스지도 없어 위험 - 효율상 S였지만 방어 시 B로 강등되어야 한다
    const defenseGrades = gradeDiscardChoice(hand, {
      requiresDefense: true,
      safety: { opponentDiscards: [] },
    });
    const result = defenseGrades.get(idx('7p'));
    expect(result?.grade).toBe('B');
    expect(result?.reason).toContain('안전도');
    expect(result?.safetyScore).toBeLessThan(50);
  });

  it('방어 국면에서도 현물(안전패)은 등급이 유지된다', () => {
    const defenseGrades = gradeDiscardChoice(hand, {
      requiresDefense: true,
      safety: { opponentDiscards: [idx('7p'), idx('1s')] },
    });
    expect(defenseGrades.get(idx('7p'))?.grade).toBe('S');
    expect(defenseGrades.get(idx('7p'))?.safetyScore).toBe(100);
  });
});
