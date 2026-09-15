import { useSyncExternalStore } from 'react';
import { StyleSheet, Text } from 'react-native';
import { HandView } from '../components/HandView';
import { AppBrand } from '../components/AppBrand';
import { Body, Button, Card, Screen } from '../components/ui';
import { NANIKIRU_APP_NAME } from '../branding';
import { tileIndexToName } from '../engine/tileCodec';
import { clearWrongAnswers, getWrongAnswers, subscribeWrongAnswers } from './wrongAnswerQueue';

export function WrongAnswerScreen() {
  const entries = useSyncExternalStore(subscribeWrongAnswers, getWrongAnswers);

  const byTheory = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.problem.theoryTag) {
      byTheory.set(tag, (byTheory.get(tag) ?? 0) + 1);
    }
  }

  return (
    <Screen>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <Text style={styles.title}>오답노트</Text>
      <Body>본훈련에서 S등급이 아닌 버림을 선택하면 여기에 쌓입니다.</Body>

      {entries.length === 0 ? (
        <Text style={styles.dim}>아직 오답이 없습니다.</Text>
      ) : (
        <>
          <Text style={styles.sectionTitle}>이론별 집계</Text>
          {[...byTheory.entries()].map(([tag, count]) => (
            <Text key={tag}>
              {tag}: {count}건
            </Text>
          ))}

          <Button title="오답노트 비우기" onPress={clearWrongAnswers} />

          {entries.map((entry) => (
            <Card key={`${entry.problem.id}-${entry.recordedAt}`}>
              <Text style={styles.entryTitle}>
                {tileIndexToName(entry.chosenTile)} 버림 — 등급 {entry.grade}
              </Text>
              <Text style={styles.entryReason}>{entry.reason}</Text>
              <HandView hand={entry.problem.hand} tileWidth={30} />
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  dim: { color: '#8a8168' },
  sectionTitle: { fontWeight: '700', marginTop: 8, marginBottom: 4 },
  entryTitle: { fontWeight: '700' },
  entryReason: { marginBottom: 8 },
});
