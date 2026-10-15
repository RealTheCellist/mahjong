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
import { NanikiruDemo } from './src/nanikiru/NanikiruDemo';
import { TrainingScreen } from './src/nanikiru/TrainingScreen';
import { TheorySlidesScreen } from './src/nanikiru/TheorySlidesScreen';
import { UnitTestScreen } from './src/nanikiru/UnitTestScreen';
import { WrongAnswerScreen } from './src/nanikiru/WrongAnswerScreen';
import { ComprehensiveScreen } from './src/nanikiru/ComprehensiveScreen';
import { Button } from './src/components/ui';
import { AppThemeProvider, useTheme, type AppTone } from './src/theme';

type Screen = 'home' | IntroScreen;

const NANIKIRU_SCREENS = new Set<Screen>([
  'nanikiru',
  'theory',
  'training',
  'unit-test',
  'wrong-answers',
  'comprehensive',
]);

function toneForScreen(screen: Screen): AppTone {
  return NANIKIRU_SCREENS.has(screen) ? 'nanikiru' : 'intro';
}

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
      {screen !== 'home' && (
        <SafeAreaView style={styles.backBar}>
          <Button title="← 홈으로" onPress={() => setScreen('home')} />
        </SafeAreaView>
      )}

      {screen === 'home' && <HomeScreen onNavigate={setScreen} allMissionsCompleted={allMissionsCompleted} />}
      {screen === 'tile-sort' && (
        <TileSortMission onComplete={() => setCompleted((c) => ({ ...c, tileSort: true }))} />
      )}
      {screen === 'shuntsu' && (
        <ShuntsuMission onComplete={() => setCompleted((c) => ({ ...c, shuntsu: true }))} />
      )}
      {screen === 'ending' && <EndingScreen onGoToNanikiru={() => setScreen('nanikiru')} />}
      {screen === 'forward-checker' && <ForwardCheckerScreen />}
      {screen === 'yaku-dictionary' && <YakuDictionaryScreen />}
      {screen === 'yaku-table' && <YakuTableScreen />}
      {screen === 'reverse-explorer' && <ReverseYakuExplorerScreen />}
      {screen === 'nanikiru' && <NanikiruDemo />}
      {screen === 'theory' && <TheorySlidesScreen />}
      {screen === 'training' && <TrainingScreen />}
      {screen === 'unit-test' && <UnitTestScreen />}
      {screen === 'wrong-answers' && <WrongAnswerScreen />}
      {screen === 'comprehensive' && <ComprehensiveScreen />}

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
  backBar: { paddingHorizontal: 20, paddingTop: 8 },
});
