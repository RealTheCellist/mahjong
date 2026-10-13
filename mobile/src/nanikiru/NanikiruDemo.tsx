import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { HandView } from '../components/HandView';
import { AppBrand } from '../components/AppBrand';
import { Body, Button, ButtonRow, Screen } from '../components/ui';
import { NANIKIRU_APP_NAME } from '../branding';
import { calculateShanten } from '../engine/shanten';
import { calculateUkeire } from '../engine/ukeire';
import { tileIndexToName } from '../engine/tileCodec';
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
    <Screen>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <Text style={styles.title}>손패 뷰어</Text>

      <ButtonRow>
        {NANIKIRU_CHAPTERS.map((id) => (
          <Button key={id} title={CHAPTER_LABELS[id] ?? id} onPress={() => switchChapter(id)} disabled={chapterId === id} />
        ))}
      </ButtonRow>

      <Body>패를 눌러서 버릴 패를 선택해보세요.</Body>

      <HandView key={sample.id} hand={hand} interactive onSelectDiscard={setDiscardIndex} />

      <Text style={styles.info}>선택한 버림패: {discardIndex === null ? '없음' : tileIndexToName(discardIndex)}</Text>
      <Text style={styles.info}>버림 후 샨텐 수: {afterDiscardShanten === null ? '-' : afterDiscardShanten}</Text>
      <Text style={styles.info}>해당 버림의 유효패 매수: {ukeireForDiscard === null ? '-' : ukeireForDiscard}</Text>

      <Button title={`다음 예제 (${(sampleIndex % samples.length) + 1}/${samples.length})`} onPress={nextSample} variant="primary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  info: { marginTop: 6 },
});
