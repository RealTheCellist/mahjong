import type { CSSProperties } from 'react';
import { loadAllChapterProgress } from '../progress/store';

const DEMO_CHAPTERS = ['1-1', '1-2', '2-1'];

export type IntroScreen =
  | 'tile-sort'
  | 'shuntsu'
  | 'nanikiru'
  | 'ending'
  | 'forward-checker'
  | 'training'
  | 'yaku-dictionary'
  | 'yaku-table';

interface HomeScreenProps {
  onNavigate: (screen: IntroScreen) => void;
  allMissionsCompleted: boolean;
}

export function HomeScreen({ onNavigate, allMissionsCompleted }: HomeScreenProps) {
  const progress = loadAllChapterProgress(DEMO_CHAPTERS);

  return (
    <section style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <h1>마작 입문 — 홈</h1>

      {allMissionsCompleted && (
        <div
          style={{
            background: 'var(--code-bg, #f4f3ec)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          모든 미션을 완료했습니다!{' '}
          <button type="button" onClick={() => onNavigate('ending')}>
            엔딩 보러 가기
          </button>
        </div>
      )}

      <h2 style={{ fontSize: 18 }}>챕터 진행률</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 24 }}>
        <thead>
          <tr>
            <th style={cellStyle}>챕터</th>
            <th style={cellStyle}>고정문제</th>
            <th style={cellStyle}>다음 챕터</th>
          </tr>
        </thead>
        <tbody>
          {DEMO_CHAPTERS.map((chapterId) => {
            const p = progress[chapterId];
            return (
              <tr key={chapterId}>
                <td style={cellStyle}>{chapterId}</td>
                <td style={cellStyle}>
                  {p ? `${p.fixedPoolCleared}/${p.fixedPoolTotal}` : '-'}
                </td>
                <td style={cellStyle}>{p?.unlockedNextChapter ? '열림' : '잠김'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2 style={{ fontSize: 18 }}>미션</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => onNavigate('tile-sort')}>
          패 종류 골라내기
        </button>
        <button type="button" onClick={() => onNavigate('shuntsu')}>
          슌쯔 만들기
        </button>
        <button type="button" onClick={() => onNavigate('forward-checker')}>
          정방향 체커 (역 판정)
        </button>
        <button type="button" onClick={() => onNavigate('yaku-dictionary')}>
          역 카드 사전
        </button>
        <button type="button" onClick={() => onNavigate('yaku-table')}>
          조건 비교 테이블
        </button>
      </div>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>다른 앱</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => onNavigate('nanikiru')}>
          나니키루 손패 뷰어
        </button>
        <button type="button" onClick={() => onNavigate('training')}>
          나니키루 본훈련
        </button>
      </div>
    </section>
  );
}

const cellStyle: CSSProperties = {
  border: '1px solid var(--border)',
  padding: '6px 10px',
  textAlign: 'center',
};
