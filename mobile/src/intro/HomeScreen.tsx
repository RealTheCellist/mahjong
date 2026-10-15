import { StyleSheet, Text, View } from 'react-native';
import { loadAllChapterProgress } from '../progress/store';
import { INTRO_APP_NAME, NANIKIRU_APP_NAME } from '../branding';
import { Button, Dropdown, Heading, Screen, type DropdownOption } from '../components/ui';
import { NANIKIRU_CHAPTERS, CHAPTER_LABELS } from '../nanikiru/fixedProblems';
import { AppThemeProvider, spacing, useTheme } from '../theme';

const MISSION_OPTIONS: DropdownOption[] = [
  { value: 'tile-sort', label: '패 종류 골라내기' },
  { value: 'shuntsu', label: '슌쯔 만들기' },
  { value: 'forward-checker', label: '정방향 체커' },
  { value: 'yaku-dictionary', label: '역 카드 사전' },
  { value: 'yaku-table', label: '조건 비교 테이블' },
  { value: 'reverse-explorer', label: '역방향 탐색기' },
];

const NANIKIRU_OPTIONS: DropdownOption[] = [
  { value: 'nanikiru', label: '손패 뷰어' },
  { value: 'theory', label: '이론학습' },
  { value: 'training', label: '본훈련' },
  { value: 'unit-test', label: '단원평가' },
  { value: 'wrong-answers', label: '오답노트' },
  { value: 'comprehensive', label: '종합응용' },
];

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
  const theme = useTheme();
  const progress = loadAllChapterProgress([...NANIKIRU_CHAPTERS]);

  return (
    <Screen>
      <Heading>{INTRO_APP_NAME}</Heading>

      {allMissionsCompleted && (
        <View style={[styles.banner, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
          <Text style={[styles.bannerText, { color: theme.heading }]}>모든 미션을 완료했습니다!</Text>
          <Button title="엔딩 보러 가기" onPress={() => onNavigate('ending')} variant="primary" />
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: theme.heading }]}>챕터 진행률</Text>
      <View style={[styles.table, { borderColor: theme.border }]}>
        <View style={[styles.row, styles.headerRow, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
          <Text style={[styles.cell, styles.headerCell, { color: theme.heading }]}>챕터</Text>
          <Text style={[styles.cell, styles.headerCell, { color: theme.heading }]}>고정문제</Text>
          <Text style={[styles.cell, styles.headerCell, { color: theme.heading }]}>단원평가</Text>
          <Text style={[styles.cell, styles.headerCell, { color: theme.heading }]}>상태</Text>
        </View>
        {NANIKIRU_CHAPTERS.map((chapterId, i) => {
          const p = progress[chapterId];
          const isAccessible = i === 0 || Boolean(progress[NANIKIRU_CHAPTERS[i - 1]]?.unlockedNextChapter);
          return (
            <View key={chapterId} style={[styles.row, { borderTopColor: theme.border }]}>
              <Text style={[styles.cell, { color: theme.text }]}>{CHAPTER_LABELS[chapterId] ?? chapterId}</Text>
              <Text style={[styles.cell, { color: theme.text }]}>
                {p ? `${p.fixedPoolCleared}/${p.fixedPoolTotal}` : '0/-'}
              </Text>
              <Text style={[styles.cell, { color: theme.text }]}>{p?.unitTestPassed ? '합격' : '미응시'}</Text>
              <Text style={[styles.cell, { color: isAccessible ? theme.text : theme.textMuted }]}>
                {isAccessible ? '열림' : '잠김'}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.heading }]}>미션</Text>
      <Dropdown placeholder="미션 선택..." options={MISSION_OPTIONS} onChange={(v) => onNavigate(v as IntroScreen)} />

      <AppThemeProvider tone="nanikiru">
        <NanikiruSection onNavigate={onNavigate} />
      </AppThemeProvider>
    </Screen>
  );
}

function NanikiruSection({ onNavigate }: Pick<HomeScreenProps, 'onNavigate'>) {
  const theme = useTheme();
  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.accent }]}>{NANIKIRU_APP_NAME}</Text>
      <Dropdown placeholder="나니키루 메뉴 선택..." options={NANIKIRU_OPTIONS} onChange={(v) => onNavigate(v as IntroScreen)} />
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  bannerText: { fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.sm, marginTop: spacing.sm },
  table: { borderWidth: 1, borderRadius: 8, marginBottom: spacing.xl, overflow: 'hidden' },
  row: { flexDirection: 'row', borderTopWidth: 1 },
  headerRow: { borderTopWidth: 0 },
  cell: { flex: 1, padding: spacing.sm, textAlign: 'center' },
  headerCell: { fontWeight: '700' },
});
