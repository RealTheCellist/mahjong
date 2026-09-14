import { describe, expect, it } from 'vitest';
import {
  createMemoryStore,
  loadAllChapterProgress,
  loadChapterProgress,
  markUnitTestResult,
  recordFixedProblemCleared,
  recordGeneratedAttempt,
  resetChapterProgress,
  saveChapterProgress,
} from '../store';

describe('progress store', () => {
  it('저장 전에는 null을 반환한다', () => {
    const store = createMemoryStore();
    expect(loadChapterProgress('1-1', store)).toBeNull();
  });

  it('저장한 진행률을 그대로 불러온다', () => {
    const store = createMemoryStore();
    saveChapterProgress(
      {
        chapterId: '1-1',
        fixedPoolTotal: 5,
        fixedPoolCleared: 3,
        generatedAttempts: 10,
        generatedCorrect: 7,
        unitTestPassed: false,
        unlockedNextChapter: false,
      },
      store,
    );
    expect(loadChapterProgress('1-1', store)).toEqual({
      chapterId: '1-1',
      fixedPoolTotal: 5,
      fixedPoolCleared: 3,
      generatedAttempts: 10,
      generatedCorrect: 7,
      unitTestPassed: false,
      unlockedNextChapter: false,
    });
  });

  it('고정문제 클리어 기록은 fixedPoolTotal을 넘지 않는다', () => {
    const store = createMemoryStore();
    for (let i = 0; i < 10; i += 1) recordFixedProblemCleared('1-1', 3, store);
    expect(loadChapterProgress('1-1', store)?.fixedPoolCleared).toBe(3);
  });

  it('임의생성 문제 시도/정답 수를 누적한다', () => {
    const store = createMemoryStore();
    recordGeneratedAttempt('1-1', 5, true, store);
    recordGeneratedAttempt('1-1', 5, false, store);
    recordGeneratedAttempt('1-1', 5, true, store);
    const progress = loadChapterProgress('1-1', store);
    expect(progress?.generatedAttempts).toBe(3);
    expect(progress?.generatedCorrect).toBe(2);
  });

  it('고정문제를 다 풀고 단원평가에 합격하면 다음 챕터가 열린다', () => {
    const store = createMemoryStore();
    recordFixedProblemCleared('1-1', 1, store);
    const progress = markUnitTestResult('1-1', 1, true, store);
    expect(progress.unlockedNextChapter).toBe(true);
  });

  it('고정문제를 다 풀지 못했으면 단원평가에 합격해도 열리지 않는다', () => {
    const store = createMemoryStore();
    const progress = markUnitTestResult('1-1', 5, true, store);
    expect(progress.fixedPoolCleared).toBe(0);
    expect(progress.unlockedNextChapter).toBe(false);
  });

  it('여러 챕터 진행률을 한 번에 불러올 수 있다', () => {
    const store = createMemoryStore();
    recordFixedProblemCleared('1-1', 3, store);
    recordFixedProblemCleared('1-2', 3, store);
    const all = loadAllChapterProgress(['1-1', '1-2', '1-3'], store);
    expect(Object.keys(all).sort()).toEqual(['1-1', '1-2']);
  });

  it('진행률을 초기화하면 다시 null을 반환한다', () => {
    const store = createMemoryStore();
    recordFixedProblemCleared('1-1', 3, store);
    resetChapterProgress('1-1', store);
    expect(loadChapterProgress('1-1', store)).toBeNull();
  });
});
