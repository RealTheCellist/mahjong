import { useMemo, useState } from 'react';
import { HandView } from './components/HandView';
import { calculateShanten } from './engine/shanten';
import { calculateUkeire } from './engine/ukeire';
import { tileIndexToName, tileNamesToHand34 } from './engine/tileCodec';
import type { Hand34 } from './engine/types';
import './App.css';

// 1샨텐 예시 손패 (14장)
const SAMPLE_HAND: Hand34 = tileNamesToHand34([
  '1m', '1m', '1m', '6p', '7p', '7p', '1s', '1s', '2s',
  '5s', '5s', '1z', '1z', '1z',
]);

function App() {
  const [discardIndex, setDiscardIndex] = useState<number | null>(null);

  const ukeireMap = useMemo(() => calculateUkeire(SAMPLE_HAND), []);

  const afterDiscardShanten = useMemo(() => {
    if (discardIndex === null) return null;
    const hand = [...SAMPLE_HAND];
    hand[discardIndex] -= 1;
    return calculateShanten(hand);
  }, [discardIndex]);

  const ukeireForDiscard = discardIndex === null ? null : ukeireMap.get(discardIndex) ?? 0;

  return (
    <section style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>손패 뷰어</h1>
      <p>패를 탭해서 버릴 패를 선택해보세요.</p>

      <HandView hand={SAMPLE_HAND} interactive onSelectDiscard={setDiscardIndex} />

      <div style={{ marginTop: 24, fontSize: 15, lineHeight: 1.8 }}>
        <div>
          선택한 버림패:{' '}
          {discardIndex === null ? '없음' : tileIndexToName(discardIndex)}
        </div>
        <div>버림 후 샨텐 수: {afterDiscardShanten === null ? '-' : afterDiscardShanten}</div>
        <div>해당 버림의 유효패 매수: {ukeireForDiscard === null ? '-' : ukeireForDiscard}</div>
      </div>
    </section>
  );
}

export default App;
