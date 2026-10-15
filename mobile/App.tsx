import { useState, type Dispatch, type SetStateAction } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { HomeScreen, type IntroScreen } from './src/intro/HomeScreen';
import { TileSortMission } from './src/intro/TileSortMission';
import { ShuntsuMission } from './src/intro/ShuntsuMission';
import { EndingScreen } from './src/intro/EndingScreen';
import { ForwardCheckerScreen } from './src/intro/ForwardCheckerScreen';
import { YakuDictionaryScreen } from './src/intro/YakuDictionaryScreen';
import { YakuTableScreen } from './src/intro/YakuTableScreen';
import { ReverseYakuExplorerScreen } from './src/intro/ReverseYakuExplorerScreen';
import { LabApp } from './src/nanikiru/LabApp';
import { NavMenu, type NavTopItem, type NavTreeSection } from './src/components/NavMenu';
import { AppThemeProvider, useTheme, type AppTone } from './src/theme';
import { INTRO_APP_NAME, NANIKIRU_APP_NAME } from './src/branding';

type Screen = 'home' | IntroScreen | 'nanikiru-lab';

function toneForScreen(screen: Screen): AppTone {
  return screen === 'nanikiru-lab' ? 'nanikiru' : 'intro';
}

const NAV_TOP_ITEMS: NavTopItem[] = [{ value: 'nanikiru-lab', label: `🀄 ${NANIKIRU_APP_NAME}`, tone: 'nanikiru' }];

const NAV_SECTIONS: NavTreeSection[] = [
  {
    key: 'intro',
    label: INTRO_APP_NAME,
    tone: 'intro',
    items: [
      { value: 'tile-sort', label: '패 종류 골라내기' },
      { value: 'shuntsu', label: '슌쯔 만들기' },
      { value: 'forward-checker', label: '정방향 체커' },
      { value: 'yaku-dictionary', label: '역 카드 사전' },
      { value: 'yaku-table', label: '조건 비교 테이블' },
      { value: 'reverse-explorer', label: '역방향 탐색기' },
    ],
  },
];

interface AppShellProps {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  setCompleted: Dispatch<SetStateAction<{ tileSort: boolean; shuntsu: boolean }>>;
  allMissionsCompleted: boolean;
}

function AppShell({ screen, setScreen, setCompleted, allMissionsCompleted }: AppShellProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <NavMenu
        topItems={NAV_TOP_ITEMS}
        sections={NAV_SECTIONS}
        onNavigateHome={() => setScreen('home')}
        onNavigate={(value) => setScreen(value as Screen)}
      />

      {screen === 'home' && <HomeScreen onNavigate={setScreen} allMissionsCompleted={allMissionsCompleted} />}
      {screen === 'tile-sort' && (
        <TileSortMission onComplete={() => setCompleted((c) => ({ ...c, tileSort: true }))} />
      )}
      {screen === 'shuntsu' && (
        <ShuntsuMission onComplete={() => setCompleted((c) => ({ ...c, shuntsu: true }))} />
      )}
      {screen === 'ending' && <EndingScreen onGoToNanikiru={() => setScreen('nanikiru-lab')} />}
      {screen === 'forward-checker' && <ForwardCheckerScreen />}
      {screen === 'yaku-dictionary' && <YakuDictionaryScreen />}
      {screen === 'yaku-table' && <YakuTableScreen />}
      {screen === 'reverse-explorer' && <ReverseYakuExplorerScreen />}
      {screen === 'nanikiru-lab' && <LabApp />}

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [completed, setCompleted] = useState({ tileSort: false, shuntsu: false });

  const allMissionsCompleted = completed.tileSort && completed.shuntsu;

  return (
    <AppThemeProvider tone={toneForScreen(screen)}>
      <AppShell
        screen={screen}
        setScreen={setScreen}
        setCompleted={setCompleted}
        allMissionsCompleted={allMissionsCompleted}
      />
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
