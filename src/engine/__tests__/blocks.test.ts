import { describe, expect, it } from 'vitest';
import { analyzeBlocks } from '../blocks';
import { tileNamesToHand34 } from '../tileCodec';

function bestDecomposition(hand: number[]) {
  const results = analyzeBlocks(hand);
  expect(results.length).toBeGreaterThan(0);
  return results[0]; // 고립패 최소 -> 블록 수 최소 순 정렬이므로 첫 번째가 최선
}

describe('analyzeBlocks — 1장. 블록론 검증 문제', () => {
  it('문제1: 완성 손패(4멘츠+1페어)는 정확히 5블록, 잉여/부족 없음', () => {
    const hand = tileNamesToHand34([
      '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m',
      '1p', '1p', '1p', '2s', '2s',
    ]);
    const best = bestDecomposition(hand);
    expect(best.blockCount).toBe(5);
    expect(best.isSurplus).toBe(false);
    expect(best.isInsufficient).toBe(false);
    expect(best.floatingTiles).toHaveLength(0);
  });

  it('문제2: 6블록 형태(4멘츠 후보+타츠 다수)는 잉여 블록으로 판정된다', () => {
    const hand = tileNamesToHand34([
      '1m', '2m', '3m',
      '4p', '5p', '6p', '8p', '9p',
      '2s', '3s', '6s', '7s',
      '1z', '1z',
    ]);
    const best = bestDecomposition(hand);
    expect(best.blockCount).toBe(6);
    expect(best.isSurplus).toBe(true);

    const taatsuKinds = best.blocks.filter((b) => b.type === 'taatsu').map((b) => b.taatsuKind);
    expect(taatsuKinds).toContain('penchan');
    expect(taatsuKinds).toContain('ryanmen');
  });

  it('문제3: 서로 인접하지 않는 고립패만 있으면 블록이 0개다 (5블록에 미달)', () => {
    const hand = tileNamesToHand34([
      '1m', '5m', '9m', '1p', '5p', '9p', '1s', '5s', '9s',
      '1z', '3z', '5z', '7z',
    ]);
    const best = bestDecomposition(hand);
    expect(best.blockCount).toBe(0);
    expect(best.isInsufficient).toBe(true);
    expect(best.floatingTiles).toHaveLength(13);
  });

  it('문제4: 정확히 5블록(1멘츠+2타츠+1페어+공백 없음)이면 잉여/부족 모두 아니다', () => {
    // 123m(완성) 45p(료멘) 78s(료멘) 3s3s(페어 후보) 대짝 하나 더: 1z1z(대짝)
    const hand = tileNamesToHand34([
      '1m', '2m', '3m', '4p', '5p', '7s', '8s', '3s', '3s', '1z', '1z',
    ]);
    const best = bestDecomposition(hand);
    expect(best.blockCount).toBe(5);
    expect(best.isSurplus).toBe(false);
    expect(best.isInsufficient).toBe(false);
  });

  it('문제5: 갱짱 타츠가 포함된 손패에서 블록 분해가 이를 인식한다', () => {
    const hand = tileNamesToHand34(['4p', '6p', '1m', '1m', '1m']);
    const results = analyzeBlocks(hand);
    const hasKanchan = results.some((r) =>
      r.blocks.some((b) => b.type === 'taatsu' && b.taatsuKind === 'kanchan'),
    );
    expect(hasKanchan).toBe(true);
  });
});
