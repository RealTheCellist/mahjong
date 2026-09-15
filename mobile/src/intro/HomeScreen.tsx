import { StyleSheet, Text, View } from 'react-native';
import { loadAllChapterProgress } from '../progress/store';
import { INTRO_APP_NAME, NANIKIRU_APP_NAME } from '../branding';
import { Body, Button, ButtonRow, Heading, Screen } from '../components/ui';

const DEMO_CHAPTERS = ['1-1', '1-2', '2-1'];

export type IntroScreen =
  | 'tile-sort'
  | 'shuntsu'
  | 'nanikiru'
  | 'ending'
  | 'forward-checker'
  | 'training'
  | 'yaku-dictionary'
  | 'yaku-table'
  | 'reverse-explorer'
  | 'theory'
  | 'unit-test'
  | 'wrong-answers'
  | 'comprehensive';

interface HomeScreenProps {
  onNavigate: (screen: IntroScreen) => void;
  allMissionsCompleted: boolean;
}

export function HomeScreen({ onNavigate, allMissionsCompleted }: HomeScreenProps) {
  const progress = loadAllChapterProgress(DEMO_CHAPTERS);

  return (
    <Screen>
      <Heading>{INTRO_APP_NAME}</Heading>

      {allMissionsCompleted && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>모든 미션을 완료했습니다!</Text>
          <Button title="엔딩 보러 가기" onPress={() => onNavigate('ending')} />
        </View>
      )}

      <Text style={styles.sectionTitle}>챕터 진행률</Text>
      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.headerCell]}>챕터</Text>
          <Text style={[styles.cell, styles.headerCell]}>고정문제</Text>
          <Text style={[styles.cell, styles.headerCell]}>다음 챕터</Text>
        </View>
        {DEMO_CHAPTERS.map((chapterId) => {
          const p = progress[chapterId];
          return (
            <View key={chapterId} style={styles.row}>
              <Text style={styles.cell}>{chapterId}</Text>
              <Text style={styles.cell}>{p ? `${p.fixedPoolCleared}/${p.fixedPoolTotal}` : '-'}</Text>
              <Text style={styles.cell}>{p?.unlockedNextChapter ? '열림' : '잠김'}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>미션</Text>
      <ButtonRow>
        <Button title="패 종류 골라내기" onPress={() => onNavigate('tile-sort')} />
        <Button title="슌쯔 만들기" onPress={() => onNavigate('shuntsu')} />
        <Button title="정방향 체커" onPress={() => onNavigate('forward-checker')} />
        <Button title="역 카드 사전" onPress={() => onNavigate('yaku-dictionary')} />
        <Button title="조건 비교 테이블" onPress={() => onNavigate('yaku-table')} />
        <Button title="역방향 탐색기" onPress={() => onNavigate('reverse-explorer')} />
      </ButtonRow>

      <Text style={styles.sectionTitle}>{NANIKIRU_APP_NAME}</Text>
      <ButtonRow>
        <Button title="손패 뷰어" onPress={() => onNavigate('nanikiru')} />
        <Button title="이론학습" onPress={() => onNavigate('theory')} />
        <Button title="본훈련" onPress={() => onNavigate('training')} />
        <Button title="단원평가" onPress={() => onNavigate('unit-test')} />
        <Button title="오답노트" onPress={() => onNavigate('wrong-answers')} />
        <Button title="종합응용" onPress={() => onNavigate('comprehensive')} />
      </ButtonRow>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#f4f3ec',
    borderWidth: 1,
    borderColor: '#e0dac6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  bannerText: { fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  table: { borderWidth: 1, borderColor: '#e0dac6', borderRadius: 8, marginBottom: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e0dac6' },
  headerRow: { borderTopWidth: 0, backgroundColor: '#f4f3ec' },
  cell: { flex: 1, padding: 8, textAlign: 'center' },
  headerCell: { fontWeight: '700' },
});
