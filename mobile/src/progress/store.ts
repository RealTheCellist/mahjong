import type { ChapterProgress, KeyValueStore } from './types';

const STORAGE_PREFIX = 'mahjong:chapterProgress:';

/** localStorage가 없는 환경(테스트, SSR)을 위한 인메모리 폴백. 모듈 생존 기간 동안 유지된다 */
const memory = new Map<string, string>();
const memoryStore: KeyValueStore = {
  getItem: (key) => (memory.has(key) ? (memory.get(key) as string) : null),
  setItem: (key, value) => {
    memory.set(key, value);
  },
  removeItem: (key) => {
    memory.delete(key);
  },
};

/** 격리된 인메모리 store를 새로 만든다 (테스트나 다중 프로필 관리 등에 사용) */
export function createMemoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

function resolveStore(store?: KeyValueStore): KeyValueStore {
  if (store) return store;
  if (typeof localStorage !== 'undefined') return localStorage;
  return memoryStore;
}

export function createInitialChapterProgress(chapterId: string, fixedPoolTotal: number): ChapterProgress {
  return {
    chapterId,
    fixedPoolTotal,
    fixedPoolCleared: 0,
    generatedAttempts: 0,
    generatedCorrect: 0,
    unitTestPassed: false,
    unlockedNextChapter: false,
  };
}

export function loadChapterProgress(chapterId: string, store?: KeyValueStore): ChapterProgress | null {
  const raw = resolveStore(store).getItem(STORAGE_PREFIX + chapterId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ChapterProgress;
  } catch {
    return null;
  }
}

export function saveChapterProgress(progress: ChapterProgress, store?: KeyValueStore): void {
  resolveStore(store).setItem(STORAGE_PREFIX + progress.chapterId, JSON.stringify(progress));
}

export function loadOrCreateChapterProgress(
  chapterId: string,
  fixedPoolTotal: number,
  store?: KeyValueStore,
): ChapterProgress {
  return loadChapterProgress(chapterId, store) ?? createInitialChapterProgress(chapterId, fixedPoolTotal);
}

export function loadAllChapterProgress(
  chapterIds: string[],
  store?: KeyValueStore,
): Record<string, ChapterProgress> {
  const result: Record<string, ChapterProgress> = {};
  for (const chapterId of chapterIds) {
    const progress = loadChapterProgress(chapterId, store);
    if (progress) result[chapterId] = progress;
  }
  return result;
}

export function recordFixedProblemCleared(
  chapterId: string,
  fixedPoolTotal: number,
  store?: KeyValueStore,
): ChapterProgress {
  const progress = loadOrCreateChapterProgress(chapterId, fixedPoolTotal, store);
  progress.fixedPoolCleared = Math.min(progress.fixedPoolTotal, progress.fixedPoolCleared + 1);
  saveChapterProgress(progress, store);
  return progress;
}

export function recordGeneratedAttempt(
  chapterId: string,
  fixedPoolTotal: number,
  wasCorrect: boolean,
  store?: KeyValueStore,
): ChapterProgress {
  const progress = loadOrCreateChapterProgress(chapterId, fixedPoolTotal, store);
  progress.generatedAttempts += 1;
  if (wasCorrect) progress.generatedCorrect += 1;
  saveChapterProgress(progress, store);
  return progress;
}

/** 단원평가 결과를 기록한다. 고정문제은행을 모두 클리어한 상태로 합격하면 다음 챕터가 열린다 */
export function markUnitTestResult(
  chapterId: string,
  fixedPoolTotal: number,
  passed: boolean,
  store?: KeyValueStore,
): ChapterProgress {
  const progress = loadOrCreateChapterProgress(chapterId, fixedPoolTotal, store);
  progress.unitTestPassed = passed;
  if (passed && progress.fixedPoolCleared >= progress.fixedPoolTotal) {
    progress.unlockedNextChapter = true;
  }
  saveChapterProgress(progress, store);
  return progress;
}

export function resetChapterProgress(chapterId: string, store?: KeyValueStore): void {
  resolveStore(store).removeItem(STORAGE_PREFIX + chapterId);
}
