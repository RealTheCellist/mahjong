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

  it('역이 없으면 에러를 던진다', () => {
    const hand = tileNamesToHand34([
      '9m', '9m', '9m', '1p', '2p', '3p', '5p', '6p', '7p', '1s', '2s', '3s', '5s', '5s',
    ]);
    expect(() => calculateScore(hand, { winTile: idx('7p'), isDealer: false, isTsumo: false })).toThrow(
      '역이 없는',
    );
  });
});
