import { describe, expect, it } from 'vitest';
import { checkYaku } from '../yaku';
import { tileNameToIndex, tileNamesToHand34 } from '../tileCodec';
import { createEmptyHand34 } from '../types';

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

  it('치또이츠: 7개의 서로 다른 페어로 구성되면 성립한다', () => {
    const hand = tileNamesToHand34([
      '1m', '1m', '3m', '3m', '5m', '5m', '7p', '7p', '9p', '9p', '2s', '2s', '4s', '4s',
    ]);
    const result = checkYaku(hand, { winTile: idx('1m') });
    expect(keysOf(result)).toContain('chiitoitsu');
  });

  it('치또이츠는 같은 패 4장을 두 페어로 인정하지 않는다', () => {
    const hand = createEmptyHand34();
    ['1m', '3m', '5m', '7p', '9p', '2s'].forEach((n) => (hand[idx(n)] = 2));
    hand[idx('4s')] = 4;
    expect(() => checkYaku(hand, { winTile: idx('4s') })).toThrow();
  });

  it('국사무쌍: 13종 요구패 + 페어 하나로 구성되면 성립하고, 13면대기는 더블역만이다', () => {
    const hand = tileNamesToHand34([
      '1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z', '1m',
    ]);
    const result = checkYaku(hand, { winTile: idx('1m') });
    expect(keysOf(result)).toContain('kokushi_13');
  });

  it('국사무쌍: 특정 패 하나만 기다리던 경우는 단일 역만이다', () => {
    const hand = tileNamesToHand34([
      '1m', '1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z',
    ]);
    const result = checkYaku(hand, { winTile: idx('7z') });
    expect(keysOf(result)).toContain('kokushi');
    expect(keysOf(result)).not.toContain('kokushi_13');
  });

  it('삼색동순: 세 수패에 같은 시작 숫자의 슌쯔가 있으면 성립한다', () => {
    const hand = tileNamesToHand34([
      '1m', '2m', '3m', '1p', '2p', '3p', '1s', '2s', '3s', '7z', '7z', '7z', '9m', '9m',
    ]);
    const result = checkYaku(hand, { winTile: idx('3s') });
    expect(keysOf(result)).toContain('sanshoku_doujun');
  });

  it('일기통관: 한 수패에서 123/456/789 슌쯔를 모두 가지면 성립한다', () => {
    const hand = tileNamesToHand34([
      '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '1p', '2p', '3p', '9s', '9s',
    ]);
    const result = checkYaku(hand, { winTile: idx('3p') });
    expect(keysOf(result)).toContain('ittsuu');
  });

  it('찬타: 모든 멘츠·페어가 노두패나 자패를 포함하면 성립한다(자패 포함)', () => {
    const hand = tileNamesToHand34([
      '1m', '2m', '3m', '7p', '8p', '9p', '1z', '1z', '1z', '9s', '9s', '9s', '9m', '9m',
    ]);
    const result = checkYaku(hand, { winTile: idx('3m') });
    expect(keysOf(result)).toContain('chanta');
    expect(keysOf(result)).not.toContain('junchan');
  });

  it('준찬타: 찬타 조건을 만족하면서 자패가 전혀 없으면 성립한다', () => {
    const hand = tileNamesToHand34([
      '1m', '2m', '3m', '7p', '8p', '9p', '1s', '1s', '1s', '9s', '9s', '9s', '9m', '9m',
    ]);
    const result = checkYaku(hand, { winTile: idx('3m') });
    expect(keysOf(result)).toContain('junchan');
    expect(keysOf(result)).not.toContain('chanta');
  });

  it('량페코: 동일한 슌쯔 조합이 두 쌍(4개) 있으면 이페코 대신 성립한다', () => {
    const hand = tileNamesToHand34([
      '2m', '2m', '3m', '3m', '4m', '4m', '5p', '5p', '6p', '6p', '7p', '7p', '9s', '9s',
    ]);
    const result = checkYaku(hand, { winTile: idx('4m') });
    expect(keysOf(result)).toContain('ryanpeikou');
    expect(keysOf(result)).not.toContain('iipeiko');
  });

  it('산안커: 암커 3개가 있으면 성립한다(론으로 완성된 샹퐁 커츠는 암커로 세지 않는다)', () => {
    const hand = tileNamesToHand34([
      '2m', '2m', '2m', '5p', '5p', '5p', '7s', '7s', '7s', '3m', '4m', '5m', '5z', '5z',
    ]);
    const result = checkYaku(hand, { winTile: idx('5m'), isTsumo: false });
    expect(keysOf(result)).toContain('sanankou');
  });

  it('스안커: 암커 4개가 있으면 성립하고, 페어로 완성되면 탕키 스안커다', () => {
    const hand = tileNamesToHand34([
      '2m', '2m', '2m', '5p', '5p', '5p', '7s', '7s', '7s', '3z', '3z', '3z', '9m', '9m',
    ]);
    const result = checkYaku(hand, { winTile: idx('9m'), isTsumo: true });
    expect(keysOf(result)).toContain('suuankou_tanki');
  });

  it('혼노두: 손패 전체가 노두패·자패로만 구성되면 성립한다', () => {
    const hand = tileNamesToHand34([
      '1m', '1m', '1m', '9p', '9p', '9p', '1s', '1s', '1s', '1z', '1z', '1z', '9m', '9m',
    ]);
    const result = checkYaku(hand, { winTile: idx('1m') });
    expect(keysOf(result)).toContain('honroutou');
    expect(keysOf(result)).toContain('toitoi');
  });

  it('소삼원/대삼원: 삼원패 커츠 개수에 따라 구분된다', () => {
    const shou = tileNamesToHand34([
      '5z', '5z', '5z', '6z', '6z', '6z', '7z', '7z', '1m', '2m', '3m', '4p', '5p', '6p',
    ]);
    expect(keysOf(checkYaku(shou, { winTile: idx('3m') }))).toContain('shousangen');

    const dai = tileNamesToHand34([
      '5z', '5z', '5z', '6z', '6z', '6z', '7z', '7z', '7z', '1m', '2m', '3m', '9p', '9p',
    ]);
    expect(keysOf(checkYaku(dai, { winTile: idx('3m') }))).toContain('daisangen');
  });

  it('자일색: 손패 전체가 자패로만 구성되면 성립한다', () => {
    const hand = tileNamesToHand34([
      '1z', '1z', '1z', '2z', '2z', '2z', '3z', '3z', '3z', '5z', '5z', '5z', '6z', '6z',
    ]);
    const result = checkYaku(hand, { winTile: idx('1z') });
    expect(keysOf(result)).toContain('tsuuiisou');
  });

  it('청노두: 자패 없이 노두패로만 구성되면 성립한다', () => {
    const hand = tileNamesToHand34([
      '1m', '1m', '1m', '9m', '9m', '9m', '1p', '1p', '1p', '9s', '9s', '9s', '1s', '1s',
    ]);
    const result = checkYaku(hand, { winTile: idx('1m') });
    expect(keysOf(result)).toContain('chinroutou');
  });

  it('소사희/대사희: 바람패 커츠 개수에 따라 구분된다', () => {
    const shou = tileNamesToHand34([
      '1z', '1z', '1z', '2z', '2z', '2z', '3z', '3z', '3z', '4z', '4z', '5p', '6p', '7p',
    ]);
    expect(keysOf(checkYaku(shou, { winTile: idx('7p') }))).toContain('shousuushii');

    const dai = tileNamesToHand34([
      '1z', '1z', '1z', '2z', '2z', '2z', '3z', '3z', '3z', '4z', '4z', '4z', '9p', '9p',
    ]);
    expect(keysOf(checkYaku(dai, { winTile: idx('1z') }))).toContain('daisuushii');
  });

  it('녹일색: 그린 타일(2·3·4·6·8삭, 발)로만 구성되면 성립한다', () => {
    const hand = tileNamesToHand34([
      '2s', '2s', '2s', '3s', '3s', '3s', '4s', '4s', '4s', '6z', '6z', '6z', '8s', '8s',
    ]);
    const result = checkYaku(hand, { winTile: idx('2s') });
    expect(keysOf(result)).toContain('ryuuiisou');
  });

  it('구련보등: 한 수패의 1112345678999 모양이면 성립하고, 9면대기면 순정구련보등이다', () => {
    const pure = tileNamesToHand34([
      '1m', '1m', '1m', '2m', '3m', '4m', '5m', '5m', '6m', '7m', '8m', '9m', '9m', '9m',
    ]);
    expect(keysOf(checkYaku(pure, { winTile: idx('5m') }))).toContain('chuuren_9');

    const impure = tileNamesToHand34([
      '1m', '1m', '1m', '2m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '9m', '9m',
    ]);
    const result = keysOf(checkYaku(impure, { winTile: idx('5m') }));
    expect(result).toContain('chuuren');
    expect(result).not.toContain('chuuren_9');
  });

  it('스깡쯔: 깡 멘츠 4개가 있으면 성립한다', () => {
    const hand = tileNamesToHand34(['9s', '9s']);
    const melds = [
      { type: 'kantsu' as const, tiles: [idx('1m'), idx('1m'), idx('1m'), idx('1m')], isOpen: true },
      { type: 'kantsu' as const, tiles: [idx('2p'), idx('2p'), idx('2p'), idx('2p')], isOpen: false },
      { type: 'kantsu' as const, tiles: [idx('3s'), idx('3s'), idx('3s'), idx('3s')], isOpen: true },
      { type: 'kantsu' as const, tiles: [idx('4s'), idx('4s'), idx('4s'), idx('4s')], isOpen: true },
    ];
    const result = checkYaku(hand, { winTile: idx('9s'), melds });
    expect(keysOf(result)).toContain('suukantsu');
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
