import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { HandView } from '../components/HandView';
import { AppBrand } from '../components/AppBrand';
import { Body, Screen } from '../components/ui';
import { NANIKIRU_APP_NAME } from '../branding';
import { calculateShanten } from '../engine/shanten';
import { calculateUkeire } from '../engine/ukeire';
import { tileIndexToName, tileNamesToHand34 } from '../engine/tileCodec';
import type { Hand34 } from '../engine/types';

const SAMPLE_HAND: Hand34 = tileNamesToHand34([
  '1m', '1m', '1m', '6p', '7p', '7p', '1s', '1s', '2s',
  '5s', '5s', '1z', '1z', '1z',
]);

export function NanikiruDemo() {
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
    <Screen>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <Text style={styles.title}>손패 뷰어</Text>
      <Body>패를 눌러서 버릴 패를 선택해보세요.</Body>

      <HandView hand={SAMPLE_HAND} interactive onSelectDiscard={setDiscardIndex} />

      <Text style={styles.info}>선택한 버림패: {discardIndex === null ? '없음' : tileIndexToName(discardIndex)}</Text>
      <Text style={styles.info}>버림 후 샨텐 수: {afterDiscardShanten === null ? '-' : afterDiscardShanten}</Text>
      <Text style={styles.info}>해당 버림의 유효패 매수: {ukeireForDiscard === null ? '-' : ukeireForDiscard}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  info: { marginTop: 6 },
});
