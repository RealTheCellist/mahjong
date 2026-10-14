import { useState } from 'react';
import { getTheorySlides } from './theorySlides';
import { NANIKIRU_CHAPTERS, CHAPTER_LABELS } from './fixedProblems';
import { AppBrand } from '../components/AppBrand';
import { NANIKIRU_APP_NAME } from '../branding';

export function TheorySlidesScreen() {
  const [chapterId, setChapterId] = useState<string>(NANIKIRU_CHAPTERS[0]);
  const [index, setIndex] = useState(0);

  const slides = getTheorySlides(chapterId);
  const slide = slides[index];
  const isFirst = index === 0;
  const isLast = index === slides.length - 1;

  const switchChapter = (nextChapterId: string) => {
    setChapterId(nextChapterId);
    setIndex(0);
  };

  return (
    <section style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <h1>이론학습</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {NANIKIRU_CHAPTERS.map((id) => (
          <button key={id} type="button" onClick={() => switchChapter(id)} disabled={chapterId === id}>
            {CHAPTER_LABELS[id] ?? id}
          </button>
        ))}
      </div>

      <p style={{ color: 'var(--text)' }}>
        {index + 1} / {slides.length}
      </p>

      <div
        style={{
          minHeight: 200,
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 20,
        }}
      >
        <h2 style={{ marginTop: 0 }}>{slide.title}</h2>
        <p style={{ lineHeight: 1.7 }}>{slide.body}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="button" disabled={isFirst} onClick={() => setIndex((i) => i - 1)}>
          이전
        </button>
        <button type="button" disabled={isLast} onClick={() => setIndex((i) => i + 1)}>
          다음
        </button>
      </div>
    </section>
  );
}
