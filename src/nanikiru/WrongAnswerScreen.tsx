import { useState, useSyncExternalStore } from 'react';
import { HandView } from '../components/HandView';
import { tileIndexToName } from '../engine/tileCodec';
import { clearWrongAnswers, getWrongAnswers, subscribeWrongAnswers } from './wrongAnswerQueue';
import { NANIKIRU_CHAPTERS, CHAPTER_LABELS } from './fixedProblems';
import { AppBrand } from '../components/AppBrand';
import { NANIKIRU_APP_NAME } from '../branding';

const ALL_CHAPTERS = '전체';

export function WrongAnswerScreen() {
  const allEntries = useSyncExternalStore(subscribeWrongAnswers, getWrongAnswers);
  const [chapterFilter, setChapterFilter] = useState<string>(ALL_CHAPTERS);

  const entries =
    chapterFilter === ALL_CHAPTERS
      ? allEntries
      : allEntries.filter((e) => e.problem.chapter === chapterFilter);

  const countByChapter = new Map<string, number>();
  for (const entry of allEntries) {
    countByChapter.set(entry.problem.chapter, (countByChapter.get(entry.problem.chapter) ?? 0) + 1);
  }

  // 같은 문제(chapter+id)를 이론별로 묶어 집계한다 (현재 챕터 필터 기준)
  const byTheory = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.problem.theoryTag) {
      byTheory.set(tag, (byTheory.get(tag) ?? 0) + 1);
    }
  }

  const handleClear = () => {
    clearWrongAnswers(chapterFilter === ALL_CHAPTERS ? undefined : chapterFilter);
  };

  return (
    <section style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <h1>오답노트</h1>
      <p>본훈련에서 S등급이 아닌 버림을 선택하면 여기에 쌓입니다.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setChapterFilter(ALL_CHAPTERS)} disabled={chapterFilter === ALL_CHAPTERS}>
          전체 ({allEntries.length})
        </button>
        {NANIKIRU_CHAPTERS.map((id) => (
          <button key={id} type="button" onClick={() => setChapterFilter(id)} disabled={chapterFilter === id}>
            {CHAPTER_LABELS[id] ?? id} ({countByChapter.get(id) ?? 0})
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <p style={{ color: 'var(--text)' }}>
          {chapterFilter === ALL_CHAPTERS ? '아직 오답이 없습니다.' : '이 챕터에는 아직 오답이 없습니다.'}
        </p>
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

          <button type="button" onClick={handleClear} style={{ marginBottom: 16 }}>
            {chapterFilter === ALL_CHAPTERS ? '오답노트 전체 비우기' : `${CHAPTER_LABELS[chapterFilter] ?? chapterFilter} 오답 비우기`}
          </button>

          {entries.map((entry) => (
            <div
              key={`${entry.problem.id}-${entry.recordedAt}`}
              style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 12 }}
            >
              <div style={{ fontWeight: 700 }}>
                {CHAPTER_LABELS[entry.problem.chapter] ?? entry.problem.chapter} · {tileIndexToName(entry.chosenTile)} 버림 — 등급 {entry.grade}
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
