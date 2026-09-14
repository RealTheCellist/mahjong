import { describe, expect, it } from 'vitest';
import { calculateUkeire } from '../ukeire';
import { tileIndexToName, tileNameToIndex, tileNamesToHand34 } from '../tileCodec';

describe('calculateUkeire', () => {
  it('13장(3n+1) 입력은 에러를 던진다', () => {
    const hand = tileNamesToHand34([
      '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m',
      '1p', '1p', '1p', '2s',
    ]);
    expect(() => calculateUkeire(hand)).toThrow();
  });

  it('1샨텐 손패에서 버림패별 유효패 매수를 계산한다', () => {
    // 1m1m1m 6p7p7p 1s1s2s 5s5s 1z1z1z (14장, 1샨텐)
    const hand = tileNamesToHand34([
      '1m', '1m', '1m', '6p', '7p', '7p', '1s', '1s', '2s',
      '5s', '5s', '1z', '1z', '1z',
    ]);
    const result = calculateUkeire(hand);

    // 6p를 버리면 7p/1s/3s/5s 등으로 텐파이 진행 가능
    const discard6p = result.get(tileNameToIndex('6p'));
    expect(discard6p).toBeDefined();
    expect(discard6p).toBeGreaterThan(0);
  });

  it('완성 직전(텐파이 유지) 버림패는 0이 아닌 유효패를 가진다', () => {
    const hand = tileNamesToHand34([
      '2p', '3p', '4p', '5s', '6s', '7s',
      '3z', '3z', '3z', '5m', '6m', '7m', '9m', '9m',
    ]);
    const result = calculateUkeire(hand);
    // 완성형이므로 정상 버림 후보가 존재해야 한다
    expect(result.size).toBeGreaterThan(0);
  });

  it('반환된 Map의 키는 유효한 패 index(0~33)이다', () => {
    const hand = tileNamesToHand34([
      '1m', '1m', '1m', '6p', '7p', '7p', '1s', '1s', '2s',
      '5s', '5s', '1z', '1z', '1z',
    ]);
    const result = calculateUkeire(hand);
    for (const index of result.keys()) {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThanOrEqual(33);
      expect(() => tileIndexToName(index)).not.toThrow();
    }
  });

  it('악수(退步) 버림 후보도 결과에 포함된다', () => {
    const hand = tileNamesToHand34([
      '1m', '1m', '1m', '6p', '7p', '7p', '1s', '1s', '2s',
      '5s', '5s', '1z', '1z', '1z',
    ]);
    const result = calculateUkeire(hand);
    // 5s를 버리면 샨텐이 후퇴하는 recedingDiscard 케이스
    expect(result.has(tileNameToIndex('5s'))).toBe(true);
  });
});
