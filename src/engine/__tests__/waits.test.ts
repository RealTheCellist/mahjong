import { describe, expect, it } from 'vitest';
import { findWaits } from '../waits';
import { tileNameToIndex, tileNamesToHand34 } from '../tileCodec';

const idx = tileNameToIndex;

describe('findWaits', () => {
  it('텐파이가 아니면 빈 배열을 반환한다', () => {
    const hand = tileNamesToHand34([
      '1m', '4m', '7m', '1p', '4p', '7p', '1s', '4s', '7s', '1z', '3z', '5z', '7z',
    ]);
    expect(findWaits(hand)).toEqual([]);
  });

  it('양면 대기는 두 종류의 패를 반환한다', () => {
    const hand = tileNamesToHand34([
      '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s',
    ]);
    // 3s4s5s6s7s 5연속 모양은 2s/5s/8s 세 종류로 완성되는 삼면대기다
    const waits = findWaits(hand);
    expect(waits).toEqual(expect.arrayContaining([idx('2s'), idx('5s'), idx('8s')]));
    expect(waits.length).toBe(3);
  });

  it('단기 대기는 페어가 되는 패 한 종류만 반환한다', () => {
    const hand = tileNamesToHand34([
      '2m', '3m', '4m', '5m', '6m', '7m', '4p', '5p', '6p', '3s', '4s', '5s', '9s',
    ]);
    expect(findWaits(hand)).toEqual([idx('9s')]);
  });
});
