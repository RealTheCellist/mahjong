import { describe, expect, it } from 'vitest';
import { canPon, canMinkan, canAnkan, findAnkanCandidates, getChiOptions } from '../calls';
import { tileNameToIndex, tileNamesToHand34 } from '../tileCodec';

const idx = tileNameToIndex;

describe('canPon / canMinkan / canAnkan', () => {
  const hand = tileNamesToHand34(['5m', '5m', '5m', '5m', '1p', '2p', '3p']);

  it('2장 이상이면 퐁이 가능하다', () => {
    expect(canPon(hand, idx('5m'))).toBe(true);
    expect(canPon(hand, idx('1p'))).toBe(false);
  });

  it('3장 이상이면 밍깡이 가능하다', () => {
    expect(canMinkan(hand, idx('5m'))).toBe(true);
    expect(canMinkan(hand, idx('1p'))).toBe(false);
  });

  it('4장이면 안깡이 가능하다', () => {
    expect(canAnkan(hand, idx('5m'))).toBe(true);
    expect(canAnkan(hand, idx('1p'))).toBe(false);
  });
});

describe('findAnkanCandidates', () => {
  it('4장인 패의 index를 모두 찾는다', () => {
    const hand = tileNamesToHand34(['5m', '5m', '5m', '5m', '7z', '7z', '7z', '7z']);
    expect(findAnkanCandidates(hand)).toEqual([idx('5m'), idx('7z')]);
  });
});

describe('getChiOptions', () => {
  it('자패는 치가 불가능하다', () => {
    const hand = tileNamesToHand34(['6z', '6z']);
    expect(getChiOptions(hand, idx('7z'))).toEqual([]);
  });

  it('가능한 모든 슌쯔 조합을 찾는다 (양쪽, 중간, 변)', () => {
    const hand = tileNamesToHand34(['2m', '3m', '4m', '5m']);
    // 3m을 버렸을 때: [1m,2m] 없음, [2m,4m] 있음, [4m,5m] 있음
    const options = getChiOptions(hand, idx('3m'));
    expect(options).toEqual(
      expect.arrayContaining([
        [idx('2m'), idx('4m')],
        [idx('4m'), idx('5m')],
      ]),
    );
    expect(options.length).toBe(2);
  });

  it('경계값(1, 9)에서 범위를 벗어나는 조합은 만들지 않는다', () => {
    const hand = tileNamesToHand34(['1m', '2m']);
    expect(getChiOptions(hand, idx('3m'))).toEqual([[idx('1m'), idx('2m')]]);
  });
});
