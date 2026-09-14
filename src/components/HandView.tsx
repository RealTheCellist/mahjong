import { useState } from 'react';
import type { Hand34 } from '../engine/types';
import { expandHand34 } from '../ui/tileDisplay';
import { Tile } from './Tile';

interface HandViewProps {
  hand: Hand34;
  /** true면 탭으로 버릴 패를 선택할 수 있다 */
  interactive?: boolean;
  onSelectDiscard?: (tileIndex: number) => void;
  tileWidth?: number;
}

export function HandView({ hand, interactive = false, onSelectDiscard, tileWidth = 44 }: HandViewProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const tiles = expandHand34(hand);

  const handleClick = (position: number, tileIndex: number) => {
    if (!interactive) return;
    setSelected(position);
    onSelectDiscard?.(tileIndex);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        padding: '12px 8px',
        flexWrap: 'wrap',
      }}
    >
      {tiles.map((tileIndex, position) => (
        <Tile
          // 동일 index가 여러 장일 수 있으므로 배열 위치를 key에 포함
          key={`${tileIndex}-${position}`}
          index={tileIndex}
          width={tileWidth}
          selected={selected === position}
          onClick={interactive ? () => handleClick(position, tileIndex) : undefined}
        />
      ))}
    </div>
  );
}
