import { describe, expect, it } from 'vitest';
import { checkYaku } from '../yaku';
import { tileNameToIndex, tileNamesToHand34 } from '../tileCodec';

const idx = tileNameToIndex;
const keysOf = (results: { key: string }[]) => results.map((r) => r.key);

describe('checkYaku', () => {
  it('탕야오+핑후: 전부 2~8 숫자패, 전 멘츠 순쯔, 료멘 대기', () => {
    const hand = tileNamesToHand34([
      '2m', '3m', '4m', '5m', '5m',
      '4p', '5p', '6p',
      '3s', '4s', '5s', '6s', '7s', '8s',
    ]);
    const result = checkYaku(hand, { winTile: idx('4p'), isTsumo: false });
    expect(keysOf(result)).toContain('tanyao');
    expect(keysOf(result)).toContain('pinfu');
  });

  it('역패(삼원패): 중(7z) 커츠가 있으면 야쿠하이가 성립한다', () => {
    const hand = tileNamesToHand34([
      '7z', '7z', '7z',
      '2m', '3m', '4m',
      '5p', '6p', '7p',
      '7s', '8s', '9s',
      '9m', '9m',
    ]);
    const result = checkYaku(hand, { winTile: idx('6p') });
    expect(keysOf(result)).toContain('yakuhai_dragon');
    expect(keysOf(result)).not.toContain('tanyao');
    expect(keysOf(result)).not.toContain('pinfu');
  });

  it('또이또이: 4멘츠 전부 커츠면 성립한다', () => {
    const hand = tileNamesToHand34([
      '1m', '1m', '1m',
      '2p', '2p', '2p',
      '3s', '3s', '3s',
      '4s', '4s', '4s',
      '5p', '5p',
    ]);
    const result = checkYaku(hand, { winTile: idx('1m') });
    expect(keysOf(result)).toContain('toitoi');
  });

  it('이페코: 동일한 순쯔가 2벌 있으면 성립한다 (멘젠 한정)', () => {
    const hand = tileNamesToHand34([
      '2m', '2m', '3m', '3m', '4m', '4m',
      '5p', '6p', '7p',
      '7s', '8s', '9s',
      '9p', '9p',
    ]);
    const result = checkYaku(hand, { winTile: idx('4m') });
    expect(keysOf(result)).toContain('iipeiko');
  });

  it('청일색: 한 가지 수패로만 구성되면 성립하고 혼일색은 성립하지 않는다', () => {
    const hand = tileNamesToHand34([
      '1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s',
      '2s', '3s', '4s', '5s', '5s',
    ]);
    const result = checkYaku(hand, { winTile: idx('5s') });
    expect(keysOf(result)).toContain('chinitsu');
    expect(keysOf(result)).not.toContain('honitsu');
  });

  it('혼일색: 한 가지 수패 + 자패로 구성되면 성립한다', () => {
    const hand = tileNamesToHand34([
      '1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s',
      '1z', '1z', '1z',
      '5s', '5s',
    ]);
    const result = checkYaku(hand, { winTile: idx('5s') });
    expect(keysOf(result)).toContain('honitsu');
    expect(keysOf(result)).not.toContain('chinitsu');
  });

  it('멘젠쯔모/리치: context 플래그를 그대로 반영한다', () => {
    const hand = tileNamesToHand34([
      '2m', '3m', '4m', '5m', '5m',
      '4p', '5p', '6p',
      '3s', '4s', '5s', '6s', '7s', '8s',
    ]);
    const result = checkYaku(hand, { winTile: idx('4p'), isTsumo: true, isRiichi: true });
    expect(keysOf(result)).toContain('menzen_tsumo');
    expect(keysOf(result)).toContain('riichi');
  });

  it('완성되지 않은 손패는 에러를 던진다', () => {
    const hand = tileNamesToHand34([
      '1m', '2m', '4m', '5m', '7m', '8m',
      '1p', '2p', '4p', '5p', '7p', '8p',
      '1s', '2s',
    ]);
    expect(() => checkYaku(hand, { winTile: idx('1m') })).toThrow();
  });
});
