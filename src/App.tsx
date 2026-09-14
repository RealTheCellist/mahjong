import { useState } from 'react';
import { HomeScreen, type IntroScreen } from './intro/HomeScreen';
import { TileSortMission } from './intro/TileSortMission';
import { ShuntsuMission } from './intro/ShuntsuMission';
import { EndingScreen } from './intro/EndingScreen';
import { NanikiruDemo } from './nanikiru/NanikiruDemo';
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
      {screen === 'nanikiru' && <NanikiruDemo />}
    </>
  );
}

export default App;
