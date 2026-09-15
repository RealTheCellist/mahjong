import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { getTileDisplay } from '../ui/tileDisplay';

interface TileProps {
  index: number;
  selected?: boolean;
  onPress?: (index: number) => void;
  width?: number;
}

const HEIGHT_RATIO = 1.4;

/**
 * React Native용 최소 검증 패 컴포넌트. 웹 앱은 riichi-mahjong-tiles(웹 SVG
 * DOM 기반) 라이브러리를 쓰지만 RN에서는 동작하지 않아, react-native-svg로
 * 핵심 정보(숫자+종류)만 표시하는 단순한 버전으로 우선 검증한다.
 */
export function Tile({ index, selected = false, onPress, width = 44 }: TileProps) {
  const { numberLabel, suitLabel, color } = getTileDisplay(index);
  const height = width * HEIGHT_RATIO;

  const style: StyleProp<ViewStyle> = {
    transform: selected ? [{ translateY: -8 }] : undefined,
  };

  const content = (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect
        x={1}
        y={1}
        width={width - 2}
        height={height - 2}
        rx={width * 0.1}
        fill="#faf6ea"
        stroke={selected ? '#f39c12' : '#a99a70'}
        strokeWidth={selected ? 3 : 1.2}
      />
      <SvgText
        x={width / 2}
        y={height * 0.5}
        textAnchor="middle"
        fontSize={width * 0.4}
        fontWeight="bold"
        fill={color}
      >
        {numberLabel}
      </SvgText>
      <SvgText x={width / 2} y={height * 0.8} textAnchor="middle" fontSize={width * 0.2} fill={color}>
        {suitLabel}
      </SvgText>
    </Svg>
  );

  if (!onPress) return <View style={style}>{content}</View>;

  return (
    <Pressable onPress={() => onPress(index)} style={style}>
      {content}
    </Pressable>
  );
}
