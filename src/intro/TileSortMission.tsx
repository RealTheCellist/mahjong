import { useMemo, useState } from 'react';
import { Tile } from '../components/Tile';
import { AppBrand } from '../components/AppBrand';
import { INTRO_APP_NAME } from '../branding';
import { checkTileSortAnswer, generateTileSortPool, pickRandomSuit } from './missionLogic';

const SUIT_LABEL: Record<string, string> = { m: '만수', p: '통수', s: '삭수', z: '자패' };

interface TileSortMissionProps {
  /** 이 미션을 처음으로 클리어한 순간 한 번 호출된다 */
  onComplete?: () => void;
}

export function TileSortMission({ onComplete }: TileSortMissionProps = {}) {
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const targetSuit = useMemo(() => pickRandomSuit(), [round]);
  const pool = useMemo(() => generateTileSortPool(targetSuit), [round, targetSuit]);

  const toggle = (position: number) => {
    if (result === 'correct') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(position)) next.delete(position);
      else next.add(position);
      return next;
    });
  };

  const check = () => {
    const isCorrect = checkTileSortAnswer(pool, targetSuit, selected);
    setResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) onComplete?.();
  };

  const nextRound = () => {
    setRound((r) => r + 1);
    setSelected(new Set());
    setResult('idle');
  };

  return (
    <section style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <AppBrand>{INTRO_APP_NAME}</AppBrand>
      <h2>미션: 패 종류 골라내기</h2>
      <p>
        <strong>{SUIT_LABEL[targetSuit]}</strong> 패만 모두 골라보세요.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 0' }}>
        {pool.map((tileIndex, position) => (
          <Tile
            key={position}
            index={tileIndex}
            width={40}
            selected={selected.has(position)}
            onClick={() => toggle(position)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {result !== 'correct' && (
          <button type="button" onClick={check}>
            확인
          </button>
        )}
        {result === 'correct' && (
          <>
            <span style={{ color: '#1e8449', fontWeight: 700 }}>정답입니다!</span>
            <button type="button" onClick={nextRound}>
              다음 문제
            </button>
          </>
        )}
        {result === 'wrong' && <span style={{ color: '#c0392b' }}>다시 확인해보세요.</span>}
      </div>
    </section>
  );
}
