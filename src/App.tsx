import { useState } from 'react';
import { HomeScreen } from './intro/HomeScreen';
import { TileSortMission } from './intro/TileSortMission';
import { ShuntsuMission } from './intro/ShuntsuMission';
import { NanikiruDemo } from './nanikiru/NanikiruDemo';
import './App.css';

type Screen = 'home' | 'tile-sort' | 'shuntsu' | 'nanikiru';

function App() {
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <>
      {screen !== 'home' && (
        <div style={{ padding: '12px 24px 0', maxWidth: 720, margin: '0 auto' }}>
          <button type="button" onClick={() => setScreen('home')}>
            ← 홈으로
          </button>
        </div>
      )}

      {screen === 'home' && <HomeScreen onNavigate={setScreen} />}
      {screen === 'tile-sort' && <TileSortMission />}
      {screen === 'shuntsu' && <ShuntsuMission />}
      {screen === 'nanikiru' && <NanikiruDemo />}
    </>
  );
}

export default App;
