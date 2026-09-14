import { getTileDisplay } from '../ui/tileDisplay';
import { getTileComponent, TILE_ASPECT_RATIO } from '../ui/tileComponents';

interface TileProps {
  index: number;
  selected?: boolean;
  onClick?: (index: number) => void;
  width?: number;
}

export function Tile({ index, selected = false, onClick, width = 44 }: TileProps) {
  const { suit, numberLabel } = getTileDisplay(index);
  const height = width * TILE_ASPECT_RATIO;
  const Component = getTileComponent(index);
  const ariaLabel = suit === 'z' ? `${numberLabel}(자패)` : numberLabel;

  return (
    <Component
      width={width}
      height={height}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onClick ? () => onClick(index) : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick(index);
            }
          : undefined
      }
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: width * 0.08,
        outline: selected ? '3px solid #f39c12' : 'none',
        outlineOffset: 1,
        transform: selected ? 'translateY(-8px)' : undefined,
        transition: 'transform 120ms ease',
        filter: selected
          ? 'drop-shadow(0 6px 4px rgba(0,0,0,0.35))'
          : 'drop-shadow(0 2px 2px rgba(0,0,0,0.25))',
      }}
    />
  );
}
