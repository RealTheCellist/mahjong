import { useState, useSyncExternalStore } from 'react';
import { StyleSheet, Text } from 'react-native';
import { HandView } from '../components/HandView';
import { AppBrand } from '../components/AppBrand';
import { Body, Button, ButtonRow, Card, Screen } from '../components/ui';
import { NANIKIRU_APP_NAME } from '../branding';
import { tileIndexToName } from '../engine/tileCodec';
import { clearWrongAnswers, getWrongAnswers, subscribeWrongAnswers } from './wrongAnswerQueue';
import { NANIKIRU_CHAPTERS, CHAPTER_LABELS } from './fixedProblems';

const ALL_CHAPTERS = '전체';

export function WrongAnswerScreen() {
  const allEntries = useSyncExternalStore(subscribeWrongAnswers, getWrongAnswers);
  const [chapterFilter, setChapterFilter] = useState<string>(ALL_CHAPTERS);

  const entries =
    chapterFilter === ALL_CHAPTERS ? allEntries : allEntries.filter((e) => e.problem.chapter === chapterFilter);

  const countByChapter = new Map<string, number>();
  for (const entry of allEntries) {
    countByChapter.set(entry.problem.chapter, (countByChapter.get(entry.problem.chapter) ?? 0) + 1);
  }

  const byTheory = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.problem.theoryTag) {
      byTheory.set(tag, (byTheory.get(tag) ?? 0) + 1);
    }
  }

  const handleClear = () => {
    clearWrongAnswers(chapterFilter === ALL_CHAPTERS ? undefined : chapterFilter);
  };

  return (
    <Screen>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <Text style={styles.title}>오답노트</Text>
      <Body>본훈련에서 S등급이 아닌 버림을 선택하면 여기에 쌓입니다.</Body>

      <ButtonRow>
        <Button
          title={`전체 (${allEntries.length})`}
          onPress={() => setChapterFilter(ALL_CHAPTERS)}
          disabled={chapterFilter === ALL_CHAPTERS}
        />
        {NANIKIRU_CHAPTERS.map((id) => (
          <Button
            key={id}
            title={`${CHAPTER_LABELS[id] ?? id} (${countByChapter.get(id) ?? 0})`}
            onPress={() => setChapterFilter(id)}
            disabled={chapterFilter === id}
          />
        ))}
      </ButtonRow>

      {entries.length === 0 ? (
        <Text style={styles.dim}>
          {chapterFilter === ALL_CHAPTERS ? '아직 오답이 없습니다.' : '이 챕터에는 아직 오답이 없습니다.'}
        </Text>
      ) : (
        <>
          <Text style={styles.sectionTitle}>이론별 집계</Text>
          {[...byTheory.entries()].map(([tag, count]) => (
            <Text key={tag}>
              {tag}: {count}건
            </Text>
          ))}

          <Button
            title={chapterFilter === ALL_CHAPTERS ? '오답노트 전체 비우기' : `${CHAPTER_LABELS[chapterFilter] ?? chapterFilter} 오답 비우기`}
            onPress={handleClear}
          />

          {entries.map((entry) => (
            <Card key={`${entry.problem.id}-${entry.recordedAt}`}>
              <Text style={styles.entryTitle}>
                {CHAPTER_LABELS[entry.problem.chapter] ?? entry.problem.chapter} · {tileIndexToName(entry.chosenTile)} 버림 — 등급{' '}
                {entry.grade}
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
