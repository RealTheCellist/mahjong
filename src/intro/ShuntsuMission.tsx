import { useEffect, useMemo, useState } from 'react';
import { Tile } from '../components/Tile';
import { generateShuntsuPool, isValidRun } from './missionLogic';

interface ShuntsuMissionProps {
  /** 이 미션을 처음으로 클리어한 순간 한 번 호출된다 */
  onComplete?: () => void;
}

export function ShuntsuMission({ onComplete }: ShuntsuMissionProps = {}) {
  const [round, setRound] = useState(0);
  const pool = useMemo(() => generateShuntsuPool(), [round]);
  const [used, setUsed] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number[]>([]);
  const [flash, setFlash] = useState<'none' | 'ok' | 'fail'>('none');

  const completedRuns = used.size / 3;
  const isCleared = used.size === pool.length;

  useEffect(() => {
    if (isCleared) onComplete?.();
  }, [isCleared, onComplete]);

  const toggle = (position: number) => {
    if (used.has(position) || isCleared) return;
    setSelected((prev) => {
      if (prev.includes(position)) return prev.filter((p) => p !== position);
      if (prev.length >= 3) return prev;
      const next = [...prev, position];
      if (next.length === 3) {
        const valid = isValidRun(next.map((p) => pool[p]));
        setFlash(valid ? 'ok' : 'fail');
        if (valid) {
          setUsed((prevUsed) => new Set([...prevUsed, ...next]));
          return [];
        }
        setTimeout(() => {
          setSelected([]);
          setFlash('none');
        }, 500);
      }
      return next;
    });
  };

  const nextRound = () => {
    setRound((r) => r + 1);
    setUsed(new Set());
    setSelected([]);
    setFlash('none');
  };

  return (
    <section style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <h2>미션: 슌쯔 만들기</h2>
      <p>연속된 숫자 3장을 순서대로 골라 순쯔(런)를 완성해보세요. ({completedRuns}/3 완성)</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 0' }}>
        {pool.map((tileIndex, position) => (
          <div key={position} style={{ opacity: used.has(position) ? 0.25 : 1 }}>
            <Tile
              index={tileIndex}
              width={40}
              selected={selected.includes(position)}
              onClick={used.has(position) ? undefined : () => toggle(position)}
            />
          </div>
        ))}
      </div>

      {flash === 'fail' && <p style={{ color: '#c0392b' }}>순쯔가 아닙니다. 다시 골라보세요.</p>}
      {isCleared && (
        <>
          <p style={{ color: '#1e8449', fontWeight: 700 }}>미션 완료! 3벌의 순쯔를 모두 만들었습니다.</p>
          <button type="button" onClick={nextRound}>
            다음 문제
          </button>
        </>
      )}
    </section>
  );
}
