import { describe, expect, it } from 'vitest';
import { classifyTaatsu } from '../taatsu';
import { tileNameToIndex } from '../tileCodec';

const idx = tileNameToIndex;

describe('classifyTaatsu', () => {
  it('4m5m은 료멘으로 분류하고 3m/6m을 대기로 갖는다', () => {
    const result = classifyTaatsu([idx('4m'), idx('5m')]);
    expect(result.type).toBe('ryanmen');
    expect(result.waits.sort()).toEqual([idx('3m'), idx('6m')].sort());
    expect(result.ukeire).toBe(8);
  });

  it('1m2m은 펜찬으로 분류하고 3m만 대기로 갖는다', () => {
    const result = classifyTaatsu([idx('1m'), idx('2m')]);
    expect(result.type).toBe('penchan');
    expect(result.waits).toEqual([idx('3m')]);
    expect(result.ukeire).toBe(4);
  });

  it('8s9s은 펜찬으로 분류하고 7s만 대기로 갖는다', () => {
    const result = classifyTaatsu([idx('9s'), idx('8s')]);
    expect(result.type).toBe('penchan');
    expect(result.waits).toEqual([idx('7s')]);
  });

  it('4p6p은 갱짱으로 분류하고 5p만 대기로 갖는다', () => {
    const result = classifyTaatsu([idx('4p'), idx('6p')]);
    expect(result.type).toBe('kanchan');
    expect(result.waits).toEqual([idx('5p')]);
    expect(result.ukeire).toBe(4);
  });

  it('같은 패 두 장은 샹퐁 후보로 분류한다', () => {
    const result = classifyTaatsu([idx('5s'), idx('5s')]);
    expect(result.type).toBe('shanpon');
    expect(result.waits).toEqual([idx('5s')]);
    expect(result.ukeire).toBe(2);
  });

  it('자패 조합은 페어가 아니면 에러를 던진다', () => {
    expect(() => classifyTaatsu([idx('1z'), idx('2z')])).toThrow();
  });

  it('인접하지 않은 숫자패 조합은 에러를 던진다', () => {
    expect(() => classifyTaatsu([idx('1m'), idx('5m')])).toThrow();
  });
});
