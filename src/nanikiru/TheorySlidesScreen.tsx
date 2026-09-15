import { useState } from 'react';
import { THEORY_SLIDES } from './theorySlides';
import { AppBrand } from '../components/AppBrand';
import { NANIKIRU_APP_NAME } from '../branding';

export function TheorySlidesScreen() {
  const [index, setIndex] = useState(0);
  const slide = THEORY_SLIDES[index];
  const isFirst = index === 0;
  const isLast = index === THEORY_SLIDES.length - 1;

  return (
    <section style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <h1>이론학습</h1>
      <p style={{ color: 'var(--text)' }}>
        {index + 1} / {THEORY_SLIDES.length}
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
