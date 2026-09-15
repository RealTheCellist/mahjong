import { useMemo, useState } from 'react';
import { HandView } from '../components/HandView';
import { checkYaku, type YakuResult } from '../engine/yaku';
import { generateRandomWinningHand } from '../problems/generator';
import { AppBrand } from '../components/AppBrand';
import { INTRO_APP_NAME } from '../branding';

export function ForwardCheckerScreen() {
  const [round, setRound] = useState(0);
  const { hand, winTile } = useMemo(() => generateRandomWinningHand(), [round]);

  const yakuList: YakuResult[] = useMemo(() => {
    try {
      return checkYaku(hand, { winTile, isTsumo: true });
    } catch {
      return [];
    }
  }, [hand, winTile]);

  return (
    <section style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <AppBrand>{INTRO_APP_NAME}</AppBrand>
      <h1>정방향 체커</h1>
      <p>무작위로 완성된 손패에서 어떤 역이 성립하는지 확인해보세요.</p>

      <HandView key={round} hand={hand} tileWidth={40} />

      <div style={{ margin: '16px 0' }}>
        {yakuList.length === 0 ? (
          <span style={{ color: 'var(--text)' }}>성립하는 역이 없습니다 (역 없이는 화료할 수 없어요).</span>
        ) : (
          <ul style={{ paddingLeft: 20 }}>
            {yakuList.map((y) => (
              <li key={y.key}>{y.name}</li>
            ))}
          </ul>
        )}
      </div>

      <button type="button" onClick={() => setRound((r) => r + 1)}>
        랜덤 손패 생성
      </button>
    </section>
  );
}
