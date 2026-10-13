import type { Problem } from '../problems/types';

export interface WrongAnswerEntry {
  problem: Problem;
  chosenTile: number;
  grade: 'A' | 'B';
  reason: string;
  recordedAt: number;
}

/** 세션 동안만 유지되는 오답 큐 (모듈 싱글턴) */
let queue: WrongAnswerEntry[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function addWrongAnswer(entry: Omit<WrongAnswerEntry, 'recordedAt'>): void {
  queue = [{ ...entry, recordedAt: Date.now() }, ...queue];
  notify();
}

export function getWrongAnswers(): WrongAnswerEntry[] {
  return queue;
}

/** chapterId를 지정하면 해당 챕터의 오답만 지우고, 생략하면 전체를 비운다 */
export function clearWrongAnswers(chapterId?: string): void {
  queue = chapterId ? queue.filter((e) => e.problem.chapter !== chapterId) : [];
  notify();
}

export function subscribeWrongAnswers(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
