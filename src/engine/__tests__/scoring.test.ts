import { describe, expect, it } from 'vitest';
import { calculateScore, doraTileFromIndicator } from '../scoring';
import { tileNameToIndex, tileNamesToHand34 } from '../tileCodec';

const idx = tileNameToIndex;

describe('doraTileFromIndicator', () => {
  it('숫자패는 다음 숫자로, 9는 1로 순환한다', () => {
    expect(doraTileFromIndicator(idx('3m'))).toBe(idx('4m'));
    expect(doraTileFromIndicator(idx('9p'))).toBe(idx('1p'));
  });

  it('바람패는 동남서북 순으로 순환한다', () => {
    expect(doraTileFromIndicator(idx('1z'))).toBe(idx('2z'));
    expect(doraTileFromIndicator(idx('4z'))).toBe(idx('1z'));
  });

  it('삼원패는 백발중 순으로 순환한다', () => {
    expect(doraTileFromIndicator(idx('5z'))).toBe(idx('6z'));
    expect(doraTileFromIndicator(idx('7z'))).toBe(idx('5z'));
  });
});

describe('calculateScore', () => {
  it('핑후+탕야오 멘젠 론은 30부로 고정된다', () => {
    const hand = tileNamesToHand34([
      '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s', '8s',
    ]);
    const result = calculateScore(hand, { winTile: idx('4p'), isDealer: false, isTsumo: false });
    expect(result.fu).toBe(30);
    expect(result.han).toBeGreaterThanOrEqual(2); // 탕야오+핑후
    expect(result.totalPoints).toBeGreaterThan(0);
  });

  it('역패 커츠가 있으면 부수가 올라간다', () => {
    const hand = tileNamesToHand34([
      '7z', '7z', '7z', '2m', '3m', '4m', '5p', '6p', '7p', '7s', '8s', '9s', '9m', '9m',
    ]);
    const result = calculateScore(hand, { winTile: idx('6p'), isDealer: false, isTsumo: false });
    expect(result.fu).toBeGreaterThan(20);
  });

  it('도라를 판수에 반영한다', () => {
    const hand = tileNamesToHand34([
      '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s', '8s',
    ]);
    const withoutDora = calculateScore(hand, { winTile: idx('4p'), isDealer: false, isTsumo: false });
    const withDora = calculateScore(hand, {
      winTile: idx('4p'),
      isDealer: false,
      isTsumo: false,
      doraIndicators: [idx('1m')], // -> 2m이 도라, 손패에 1장
    });
    expect(withDora.han).toBe(withoutDora.han + 1);
    expect(withDora.totalPoints).toBeGreaterThanOrEqual(withoutDora.totalPoints);
  });

  it('딜러 쯔모는 3명에게 동일 금액을 받는다(총점은 그 3배)', () => {
    const hand = tileNamesToHand34([
      '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s', '8s',
    ]);
    const result = calculateScore(hand, { winTile: idx('4p'), isDealer: true, isTsumo: true });
    expect(result.totalPoints % 300).toBe(0); // 3명에게 동일 금액씩 걷으므로 300의 배수
  });

  it('breakdown에 역별 판수와 도라 줄이 포함된다', () => {
    const hand = tileNamesToHand34([
      '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s', '8s',
    ]);
    const result = calculateScore(hand, {
      winTile: idx('4p'),
      isDealer: false,
      isTsumo: false,
      doraIndicators: [idx('1m')], // -> 2m이 도라, 손패에 1장
    });
    expect(result.doraHan).toBe(1);
    expect(result.breakdown.some((l) => l.key === 'dora' && l.han === 1)).toBe(true);
    const sumOfLines = result.breakdown.reduce((sum, l) => sum + l.han, 0);
    expect(sumOfLines).toBe(result.han);
  });

  it('안깡(멘젠 유지)은 부수에 반영되고 멘젠 상태를 유지한다', () => {
    const hand = tileNamesToHand34(['2m', '3m', '4m', '5p', '6p', '7p', '3s', '4s', '5s', '9s', '9s']);
    const result = calculateScore(hand, {
      winTile: idx('5s'),
      isDealer: false,
      isTsumo: false,
      melds: [{ type: 'kantsu', tiles: [idx('5z'), idx('5z'), idx('5z'), idx('5z')], isOpen: false }],
    });
    // 20(기본) + 10(멘젠 론) + 32(자패 안깡) = 62 -> 70으로 올림
    expect(result.fu).toBe(70);
    expect(result.yaku.some((y) => y.key === 'yakuhai_dragon')).toBe(true);
  });

  it('치또이츠는 쯔모/론에 관계없이 25부로 고정된다', () => {
    const hand = tileNamesToHand34([
      '1m', '1m', '3m', '3m', '5m', '5m', '7p', '7p', '9p', '9p', '2s', '2s', '4s', '4s',
    ]);
    const ron = calculateScore(hand, { winTile: idx('1m'), isDealer: false, isTsumo: false });
    const tsumo = calculateScore(hand, { winTile: idx('1m'), isDealer: false, isTsumo: true });
    expect(ron.fu).toBe(25);
    expect(tsumo.fu).toBe(25);
    expect(ron.han).toBeGreaterThanOrEqual(2); // 치또이츠 2판
  });

  it('역만(비딜러 쯔모)은 도라를 무시하고 base 8000 기준으로 16000/8000×2 = 32000점이 걷힌다', () => {
    const hand = tileNamesToHand34([
      '5z', '5z', '5z', '6z', '6z', '6z', '7z', '7z', '7z', '1m', '2m', '3m', '9p', '9p',
    ]);
    const result = calculateScore(hand, {
      winTile: idx('3m'),
      isDealer: false,
      isTsumo: true,
      doraIndicators: [idx('1z')], // 도라가 있어도 역만에는 영향 없어야 한다
    });
    expect(result.han).toBe(13);
    expect(result.doraHan).toBe(0);
    expect(result.yaku).toEqual([{ key: 'daisangen', name: '대삼원' }]);
    expect(result.totalPoints).toBe(32000);
  });

  it('더블역만(국사무쌍 13면대기, 딜러 쯔모)은 base 16000 기준으로 32000점씩 걷혀 총 96000점이다', () => {
    const hand = tileNamesToHand34([
      '1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z', '1m',
    ]);
    const result = calculateScore(hand, { winTile: idx('1m'), isDealer: true, isTsumo: true });
    expect(result.han).toBe(26);
    expect(result.totalPoints).toBe(96000);
  });

  it('론으로 완성된 샹퐁 커츠는 밍커로 취급해 산안커를 과다 인정하지 않는다', () => {
    // 2m2m(샹퐁 대기 중 한쪽) + 5p5p5p(암커) + 9m9m9m(암커) + 3s4s5s(슌쯔) + 7z7z(페어)
    // 2m을 론으로 완성하면 암커는 2개뿐이라 산안커가 성립하지 않아야 한다
    const hand = tileNamesToHand34([
      '2m', '2m', '5p', '5p', '5p', '9m', '9m', '9m', '3s', '4s', '5s', '7z', '7z', '2m',
    ]);
    const result = calculateScore(hand, { winTile: idx('2m'), isDealer: false, isTsumo: false, isRiichi: true });
    expect(result.yaku.some((y) => y.key === 'sanankou')).toBe(false);
    // 20(기본) + 10(멘젠 론) + 2(2m 밍커) + 4(5p 암커) + 8(9m 암커, 노두) + 2(7z 역패 페어) = 46 -> 50
    expect(result.fu).toBe(50);
  });

  it('역이 없으면 에러를 던진다', () => {
    const hand = tileNamesToHand34([
      '9m', '9m', '9m', '1p', '2p', '3p', '5p', '6p', '7p', '1s', '2s', '3s', '5s', '5s',
    ]);
    expect(() => calculateScore(hand, { winTile: idx('7p'), isDealer: false, isTsumo: false })).toThrow(
      '역이 없는',
    );
  });
});
