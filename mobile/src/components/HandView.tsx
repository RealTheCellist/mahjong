import { useState } from 'react';
import { View } from 'react-native';
import type { Hand34 } from '../engine/types';
import { expandHand34 } from '../ui/tileDisplay';
import { Tile } from './Tile';

interface HandViewProps {
  hand: Hand34;
  interactive?: boolean;
  onSelectDiscard?: (tileIndex: number) => void;
  tileWidth?: number;
}

export function HandView({ hand, interactive = false, onSelectDiscard, tileWidth = 40 }: HandViewProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const tiles = expandHand34(hand);

  const handlePress = (position: number, tileIndex: number) => {
    if (!interactive) return;
    setSelected(position);
    onSelectDiscard?.(tileIndex);
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingVertical: 12 }}>
      {tiles.map((tileIndex, position) => (
        <Tile
          key={`${tileIndex}-${position}`}
          index={tileIndex}
          width={tileWidth}
          selected={selected === position}
          onPress={interactive ? () => handlePress(position, tileIndex) : undefined}
        />
      ))}
    </View>
  );
}
