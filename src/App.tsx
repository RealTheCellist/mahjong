import { useState } from 'react';
import { HomeScreen, type IntroScreen } from './intro/HomeScreen';
import { TileSortMission } from './intro/TileSortMission';
import { ShuntsuMission } from './intro/ShuntsuMission';
import { EndingScreen } from './intro/EndingScreen';
import { ForwardCheckerScreen } from './intro/ForwardCheckerScreen';
import { YakuDictionaryScreen } from './intro/YakuDictionaryScreen';
import { YakuTableScreen } from './intro/YakuTableScreen';
import { ReverseYakuExplorerScreen } from './intro/ReverseYakuExplorerScreen';
import { PracticeGameScreen } from './intro/PracticeGameScreen';
import { NanikiruDemo } from './nanikiru/NanikiruDemo';
import { TrainingScreen } from './nanikiru/TrainingScreen';
import { TheorySlidesScreen } from './nanikiru/TheorySlidesScreen';
import { UnitTestScreen } from './nanikiru/UnitTestScreen';
import { WrongAnswerScreen } from './nanikiru/WrongAnswerScreen';
import { ComprehensiveScreen } from './nanikiru/ComprehensiveScreen';
import './App.css';

type Screen = 'home' | IntroScreen;

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [completed, setCompleted] = useState({ tileSort: false, shuntsu: false });

  const allMissionsCompleted = completed.tileSort && completed.shuntsu;

  return (
    <>
      {screen !== 'home' && (
        <div style={{ padding: '12px 24px 0', maxWidth: 720, margin: '0 auto' }}>
          <button type="button" onClick={() => setScreen('home')}>
            ← 홈으로
          </button>
        </div>
      )}

      {screen === 'home' && (
        <HomeScreen onNavigate={setScreen} allMissionsCompleted={allMissionsCompleted} />
      )}
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
      {screen === 'practice-game' && <PracticeGameScreen />}
      {screen === 'nanikiru' && <NanikiruDemo />}
      {screen === 'theory' && <TheorySlidesScreen />}
      {screen === 'training' && <TrainingScreen />}
      {screen === 'unit-test' && <UnitTestScreen />}
      {screen === 'wrong-answers' && <WrongAnswerScreen />}
      {screen === 'comprehensive' && <ComprehensiveScreen />}
    </>
  );
}

export default App;
