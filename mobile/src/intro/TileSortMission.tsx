import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tile } from '../components/Tile';
import { AppBrand } from '../components/AppBrand';
import { Body, Button, Screen } from '../components/ui';
import { INTRO_APP_NAME } from '../branding';
import { checkTileSortAnswer, generateTileSortPool, pickRandomSuit } from './missionLogic';

const SUIT_LABEL: Record<string, string> = { m: '만수', p: '통수', s: '삭수', z: '자패' };

interface TileSortMissionProps {
  onComplete?: () => void;
}

export function TileSortMission({ onComplete }: TileSortMissionProps = {}) {
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const targetSuit = useMemo(() => pickRandomSuit(), [round]);
  const pool = useMemo(() => generateTileSortPool(targetSuit), [round, targetSuit]);

  const toggle = (position: number) => {
    if (result === 'correct') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(position)) next.delete(position);
      else next.add(position);
      return next;
    });
  };

  const check = () => {
    const isCorrect = checkTileSortAnswer(pool, targetSuit, selected);
    setResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) onComplete?.();
  };

  const nextRound = () => {
    setRound((r) => r + 1);
    setSelected(new Set());
    setResult('idle');
  };

  return (
    <Screen>
      <AppBrand>{INTRO_APP_NAME}</AppBrand>
      <Text style={styles.title}>미션: 패 종류 골라내기</Text>
      <Body>
        <Text style={{ fontWeight: '700' }}>{SUIT_LABEL[targetSuit]}</Text> 패만 모두 골라보세요.
      </Body>

      <View style={styles.grid}>
        {pool.map((tileIndex, position) => (
          <Tile
            key={position}
            index={tileIndex}
            width={40}
            selected={selected.has(position)}
            onPress={() => toggle(position)}
          />
        ))}
      </View>

      <View style={styles.row}>
        {result !== 'correct' && <Button title="확인" onPress={check} variant="primary" />}
        {result === 'correct' && (
          <>
            <Text style={styles.correct}>정답입니다!</Text>
            <Button title="다음 문제" onPress={nextRound} />
          </>
        )}
        {result === 'wrong' && <Text style={styles.wrong}>다시 확인해보세요.</Text>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 12 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  correct: { color: '#1e8449', fontWeight: '700' },
  wrong: { color: '#c0392b' },
});
