import type { SvgProps } from 'react-native-svg';
import { RegularMan1M } from '../tiles/RegularMan1M';
import { RegularMan2M } from '../tiles/RegularMan2M';
import { RegularMan3M } from '../tiles/RegularMan3M';
import { RegularMan4M } from '../tiles/RegularMan4M';
import { RegularMan5M } from '../tiles/RegularMan5M';
import { RegularMan6M } from '../tiles/RegularMan6M';
import { RegularMan7M } from '../tiles/RegularMan7M';
import { RegularMan8M } from '../tiles/RegularMan8M';
import { RegularMan9M } from '../tiles/RegularMan9M';
import { RegularPin1M } from '../tiles/RegularPin1M';
import { RegularPin2M } from '../tiles/RegularPin2M';
import { RegularPin3M } from '../tiles/RegularPin3M';
import { RegularPin4M } from '../tiles/RegularPin4M';
import { RegularPin5M } from '../tiles/RegularPin5M';
import { RegularPin6M } from '../tiles/RegularPin6M';
import { RegularPin7M } from '../tiles/RegularPin7M';
import { RegularPin8M } from '../tiles/RegularPin8M';
import { RegularPin9M } from '../tiles/RegularPin9M';
import { RegularSou1M } from '../tiles/RegularSou1M';
import { RegularSou2M } from '../tiles/RegularSou2M';
import { RegularSou3M } from '../tiles/RegularSou3M';
import { RegularSou4M } from '../tiles/RegularSou4M';
import { RegularSou5M } from '../tiles/RegularSou5M';
import { RegularSou6M } from '../tiles/RegularSou6M';
import { RegularSou7M } from '../tiles/RegularSou7M';
import { RegularSou8M } from '../tiles/RegularSou8M';
import { RegularSou9M } from '../tiles/RegularSou9M';
import { RegularTonM } from '../tiles/RegularTonM';
import { RegularNanM } from '../tiles/RegularNanM';
import { RegularShaaM } from '../tiles/RegularShaaM';
import { RegularPeiM } from '../tiles/RegularPeiM';
import { RegularHakuM } from '../tiles/RegularHakuM';
import { RegularHatsuM } from '../tiles/RegularHatsuM';
import { RegularChunM } from '../tiles/RegularChunM';

export type TileComponent = (props: SvgProps) => React.JSX.Element;

/** index(0~33) -> riichi-mahjong-tiles를 react-native-svg로 변환한 정면 패 컴포넌트 */
const TILE_COMPONENTS: TileComponent[] = [
  RegularMan1M, RegularMan2M, RegularMan3M, RegularMan4M, RegularMan5M,
  RegularMan6M, RegularMan7M, RegularMan8M, RegularMan9M,
  RegularPin1M, RegularPin2M, RegularPin3M, RegularPin4M, RegularPin5M,
  RegularPin6M, RegularPin7M, RegularPin8M, RegularPin9M,
  RegularSou1M, RegularSou2M, RegularSou3M, RegularSou4M, RegularSou5M,
  RegularSou6M, RegularSou7M, RegularSou8M, RegularSou9M,
  // 東南西北白發中
  RegularTonM, RegularNanM, RegularShaaM, RegularPeiM, RegularHakuM, RegularHatsuM, RegularChunM,
];

export function getTileComponent(index: number): TileComponent {
  const component = TILE_COMPONENTS[index];
  if (!component) throw new RangeError(`invalid tile index: ${index}`);
  return component;
}

/** riichi-mahjong-tiles 원본 SVG의 가로:세로 비율 (300:400) */
export const TILE_ASPECT_RATIO = 400 / 300;
