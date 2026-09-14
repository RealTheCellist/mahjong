import { useSyncExternalStore } from 'react';
import { HandView } from '../components/HandView';
import { tileIndexToName } from '../engine/tileCodec';
import { clearWrongAnswers, getWrongAnswers, subscribeWrongAnswers } from './wrongAnswerQueue';

export function WrongAnswerScreen() {
  const entries = useSyncExternalStore(subscribeWrongAnswers, getWrongAnswers);

  // 같은 문제(chapter+id)를 이론별로 묶어 집계한다
  const byTheory = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.problem.theoryTag) {
      byTheory.set(tag, (byTheory.get(tag) ?? 0) + 1);
    }
  }

  return (
    <section style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>오답노트</h1>
      <p>본훈련에서 S등급이 아닌 버림을 선택하면 여기에 쌓입니다.</p>

      {entries.length === 0 ? (
        <p style={{ color: 'var(--text)' }}>아직 오답이 없습니다.</p>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <strong>이론별 집계</strong>
            <ul>
              {[...byTheory.entries()].map(([tag, count]) => (
                <li key={tag}>
                  {tag}: {count}건
                </li>
              ))}
            </ul>
          </div>

          <button type="button" onClick={clearWrongAnswers} style={{ marginBottom: 16 }}>
            오답노트 비우기
          </button>

          {entries.map((entry) => (
            <div
              key={`${entry.problem.id}-${entry.recordedAt}`}
              style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 12 }}
            >
              <div style={{ fontWeight: 700 }}>
                {tileIndexToName(entry.chosenTile)} 버림 — 등급 {entry.grade}
              </div>
              <div style={{ marginBottom: 8 }}>{entry.reason}</div>
              <HandView hand={entry.problem.hand} tileWidth={32} />
            </div>
          ))}
        </>
      )}
    </section>
  );
}
