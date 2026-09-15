import { describe, expect, it } from 'vitest';
import { calculateShanten } from '../shanten';
import { tileNamesToHand34 } from '../tileCodec';

describe('calculateShanten', () => {
  it('완성 손패(화료)는 -1을 반환한다', () => {
    const hand = tileNamesToHand34([
      '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m',
      '1p', '1p', '1p', '2s', '2s',
    ]);
    expect(calculateShanten(hand)).toBe(-1);
  });

  it('텐파이 손패는 0을 반환한다', () => {
    const hand = tileNamesToHand34([
      '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m',
      '1p', '1p', '1p', '2s',
    ]);
    expect(calculateShanten(hand)).toBe(0);
  });

  it('1샨텐 손패는 1을 반환한다', () => {
    const hand = tileNamesToHand34([
      '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m',
      '1p', '1p', '1p', '2s', '3s',
    ]);
    expect(calculateShanten(hand)).toBe(1);
  });

  it('국사무쌍(13종 요구패) 텐파이 형태는 0을 반환한다', () => {
    // RuleSet의 calShanten은 표준형/치또이/국사 등 전체 패턴 중 최소 샨텐을 반환한다
    const hand = tileNamesToHand34([
      '1m', '9m', '1p', '9p', '1s', '9s',
      '1z', '2z', '3z', '4z', '5z', '6z', '7z',
    ]);
    expect(calculateShanten(hand)).toBe(0);
  });

  it('14장 완성 손패도 처리한다(3n+2 입력)', () => {
    const hand = tileNamesToHand34([
      '2p', '3p', '4p', '5s', '6s', '7s',
      '3z', '3z', '3z', '5m', '6m', '7m', '9m', '9m',
    ]);
    expect(calculateShanten(hand)).toBe(-1);
  });
});
