import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tile } from '../components/Tile';
import { AppBrand } from '../components/AppBrand';
import { Body, Button, Heading, Screen } from '../components/ui';
import { INTRO_APP_NAME } from '../branding';
import { generateShuntsuPool, isValidRun } from './missionLogic';
import { useTheme } from '../theme';

interface ShuntsuMissionProps {
  onComplete?: () => void;
}

export function ShuntsuMission({ onComplete }: ShuntsuMissionProps = {}) {
  const theme = useTheme();
  const [round, setRound] = useState(0);
  const pool = useMemo(() => generateShuntsuPool(), [round]);
  const [used, setUsed] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number[]>([]);
  const [flash, setFlash] = useState<'none' | 'ok' | 'fail'>('none');

  const completedRuns = used.size / 3;
  const isCleared = used.size === pool.length;

  useEffect(() => {
    if (isCleared) onComplete?.();
  }, [isCleared, onComplete]);

  const toggle = (position: number) => {
    if (used.has(position) || isCleared) return;
    setSelected((prev) => {
      if (prev.includes(position)) return prev.filter((p) => p !== position);
      if (prev.length >= 3) return prev;
      const next = [...prev, position];
      if (next.length === 3) {
        const valid = isValidRun(next.map((p) => pool[p]));
        setFlash(valid ? 'ok' : 'fail');
        if (valid) {
          setUsed((prevUsed) => new Set([...prevUsed, ...next]));
          return [];
        }
        setTimeout(() => {
          setSelected([]);
          setFlash('none');
        }, 500);
      }
      return next;
    });
  };

  const nextRound = () => {
    setRound((r) => r + 1);
    setUsed(new Set());
    setSelected([]);
    setFlash('none');
  };

  return (
    <Screen>
      <AppBrand>{INTRO_APP_NAME}</AppBrand>
      <Heading>미션: 슌쯔 만들기</Heading>
      <Body>연속된 숫자 3장을 순서 무관하게 골라 순쯔(런)를 완성해보세요. ({completedRuns}/3 완성)</Body>

      <View style={styles.grid}>
        {pool.map((tileIndex, position) => (
          <View key={position} style={{ opacity: used.has(position) ? 0.25 : 1 }}>
            <Tile
              index={tileIndex}
              width={40}
              selected={selected.includes(position)}
              onPress={used.has(position) ? undefined : () => toggle(position)}
            />
          </View>
        ))}
      </View>

      {flash === 'fail' && <Text style={[styles.wrong, { color: theme.danger }]}>순쯔가 아닙니다. 다시 골라보세요.</Text>}
      {isCleared && (
        <>
          <Text style={[styles.correct, { color: theme.accent }]}>미션 완료! 3벌의 순쯔를 모두 만들었습니다.</Text>
          <Button title="다음 문제" onPress={nextRound} variant="primary" />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 12 },
  correct: { fontWeight: '700', marginBottom: 8 },
  wrong: { marginBottom: 8 },
});
