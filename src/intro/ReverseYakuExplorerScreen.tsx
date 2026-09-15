import { useMemo, useState } from 'react';
import { Tile } from '../components/Tile';
import { expandHand34 } from '../ui/tileDisplay';
import { tileNameToIndex } from '../engine/tileCodec';
import { YAKU_CATALOG } from './yakuCatalog';
import { AppBrand } from '../components/AppBrand';
import { INTRO_APP_NAME } from '../branding';

export function ReverseYakuExplorerScreen() {
  const [selectedKey, setSelectedKey] = useState(YAKU_CATALOG[0].key);
  const entry = YAKU_CATALOG.find((e) => e.key === selectedKey) ?? YAKU_CATALOG[0];

  const tiles = useMemo(() => expandHand34(entry.exampleHand), [entry]);

  // highlightTiles의 각 이름을 손패 안에서 한 번씩만 매칭시켜 위치를 찾는다
  const highlightPositions = useMemo(() => {
    const remaining = [...entry.highlightTiles];
    const positions = new Set<number>();
    tiles.forEach((tileIndex, position) => {
      const idx = remaining.findIndex((n) => tileNameToIndex(n) === tileIndex);
      if (idx !== -1) {
        positions.add(position);
        remaining.splice(idx, 1);
      }
    });
    return positions;
  }, [tiles, entry]);

  return (
    <section style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <AppBrand>{INTRO_APP_NAME}</AppBrand>
      <h1>역방향 탐색기</h1>
      <p>역을 선택하면 조건을 만족시키는 핵심 패가 강조 표시됩니다.</p>

      <select
        value={selectedKey}
        onChange={(e) => setSelectedKey(e.target.value)}
        style={{ padding: 6, marginBottom: 16 }}
      >
        {YAKU_CATALOG.map((e) => (
          <option key={e.key} value={e.key}>
            {e.name}
          </option>
        ))}
      </select>

      <p>{entry.condition}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '12px 0' }}>
        {tiles.map((tileIndex, position) => (
          <Tile key={position} index={tileIndex} width={40} selected={highlightPositions.has(position)} />
        ))}
      </div>
    </section>
  );
}
