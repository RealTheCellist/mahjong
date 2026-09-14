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

export function clearWrongAnswers(): void {
  queue = [];
  notify();
}

export function subscribeWrongAnswers(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
