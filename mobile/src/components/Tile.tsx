import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { getTileDisplay } from '../ui/tileDisplay';
import { getTileComponent, TILE_ASPECT_RATIO } from '../ui/tileComponents';

interface TileProps {
  index: number;
  selected?: boolean;
  onPress?: (index: number) => void;
  width?: number;
}

export function Tile({ index, selected = false, onPress, width = 44 }: TileProps) {
  const { numberLabel, suitLabel } = getTileDisplay(index);
  const height = width * TILE_ASPECT_RATIO;
  const Component = getTileComponent(index);

  const style: StyleProp<ViewStyle> = {
    transform: selected ? [{ translateY: -8 }] : undefined,
    borderRadius: width * 0.08,
    borderWidth: selected ? 3 : 0,
    borderColor: '#f39c12',
    shadowColor: '#000',
    shadowOpacity: selected ? 0.35 : 0.2,
    shadowRadius: selected ? 4 : 2,
    shadowOffset: { width: 0, height: selected ? 4 : 1 },
    elevation: selected ? 6 : 2,
  };

  const content = <Component width={width} height={height} />;

  if (!onPress) {
    return (
      <View style={style} accessibilityLabel={`${numberLabel}${suitLabel}`}>
        {content}
      </View>
    );
  }

  return (
    <Pressable onPress={() => onPress(index)} style={style} accessibilityLabel={`${numberLabel}${suitLabel}`}>
      {content}
    </Pressable>
  );
}
