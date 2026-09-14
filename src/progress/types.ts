export interface ChapterProgress {
  chapterId: string;
  fixedPoolTotal: number;
  fixedPoolCleared: number;
  generatedAttempts: number;
  generatedCorrect: number;
  unitTestPassed: boolean;
  unlockedNextChapter: boolean;
}

/** localStorage와 동일한 최소 인터페이스. 테스트/SSR 환경에서는 인메모리 구현으로 대체된다 */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
