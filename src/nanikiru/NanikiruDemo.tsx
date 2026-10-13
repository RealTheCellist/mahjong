import { useMemo, useState } from 'react';
import { HandView } from '../components/HandView';
import { calculateShanten } from '../engine/shanten';
import { calculateUkeire } from '../engine/ukeire';
import { tileIndexToName } from '../engine/tileCodec';
import { AppBrand } from '../components/AppBrand';
import { NANIKIRU_APP_NAME } from '../branding';
import { NANIKIRU_CHAPTERS, CHAPTER_LABELS, getFixedProblems } from './fixedProblems';

export function NanikiruDemo() {
  const [chapterId, setChapterId] = useState<string>(NANIKIRU_CHAPTERS[0]);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [discardIndex, setDiscardIndex] = useState<number | null>(null);

  const samples = getFixedProblems(chapterId);
  const sample = samples[sampleIndex % samples.length];
  const hand = sample.hand;

  const ukeireMap = useMemo(() => calculateUkeire(hand), [hand]);

  const afterDiscardShanten = useMemo(() => {
    if (discardIndex === null) return null;
    const next = [...hand];
    next[discardIndex] -= 1;
    return calculateShanten(next);
  }, [hand, discardIndex]);

  const ukeireForDiscard = discardIndex === null ? null : ukeireMap.get(discardIndex) ?? 0;

  const switchChapter = (nextChapterId: string) => {
    setChapterId(nextChapterId);
    setSampleIndex(0);
    setDiscardIndex(null);
  };

  const nextSample = () => {
    setSampleIndex((i) => (i + 1) % samples.length);
    setDiscardIndex(null);
  };

  return (
    <section style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <h1>손패 뷰어</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {NANIKIRU_CHAPTERS.map((id) => (
          <button key={id} type="button" onClick={() => switchChapter(id)} disabled={chapterId === id}>
            {CHAPTER_LABELS[id] ?? id}
          </button>
        ))}
      </div>

      <p>패를 탭해서 버릴 패를 선택해보세요.</p>

      <HandView key={sample.id} hand={hand} interactive onSelectDiscard={setDiscardIndex} />

      <div style={{ marginTop: 24, fontSize: 15, lineHeight: 1.8 }}>
        <div>
          선택한 버림패:{' '}
          {discardIndex === null ? '없음' : tileIndexToName(discardIndex)}
        </div>
        <div>버림 후 샨텐 수: {afterDiscardShanten === null ? '-' : afterDiscardShanten}</div>
        <div>해당 버림의 유효패 매수: {ukeireForDiscard === null ? '-' : ukeireForDiscard}</div>
      </div>

      <button type="button" onClick={nextSample} style={{ marginTop: 12 }}>
        다음 예제 ({((sampleIndex % samples.length) + 1)}/{samples.length})
      </button>
    </section>
  );
}
