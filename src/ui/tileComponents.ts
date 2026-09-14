import type { SVGProps } from 'react';
import {
  RegularMan1M,
  RegularMan2M,
  RegularMan3M,
  RegularMan4M,
  RegularMan5M,
  RegularMan6M,
  RegularMan7M,
  RegularMan8M,
  RegularMan9M,
  RegularPin1M,
  RegularPin2M,
  RegularPin3M,
  RegularPin4M,
  RegularPin5M,
  RegularPin6M,
  RegularPin7M,
  RegularPin8M,
  RegularPin9M,
  RegularSou1M,
  RegularSou2M,
  RegularSou3M,
  RegularSou4M,
  RegularSou5M,
  RegularSou6M,
  RegularSou7M,
  RegularSou8M,
  RegularSou9M,
  RegularTonM,
  RegularNanM,
  RegularShaaM,
  RegularPeiM,
  RegularHakuM,
  RegularHatsuM,
  RegularChunM,
} from 'riichi-mahjong-tiles';

export type TileComponent = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

/** index(0~33) -> riichi-mahjong-tiles의 "merged"(배경 포함) 정면 패 컴포넌트 */
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
  if (!component) {
    throw new RangeError(`invalid tile index: ${index}`);
  }
  return component;
}

/** riichi-mahjong-tiles 원본 SVG의 가로:세로 비율 (300:400) */
export const TILE_ASPECT_RATIO = 400 / 300;
