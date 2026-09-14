import { getTileDisplay } from '../ui/tileDisplay';

interface TileProps {
  index: number;
  selected?: boolean;
  onClick?: (index: number) => void;
  width?: number;
}

const HEIGHT_RATIO = 1.4;

export function Tile({ index, selected = false, onClick, width = 44 }: TileProps) {
  const { numberLabel, suitLabel, color } = getTileDisplay(index);
  const height = width * HEIGHT_RATIO;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${numberLabel}${suitLabel}`}
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
        transform: selected ? 'translateY(-8px)' : undefined,
        transition: 'transform 120ms ease',
        filter: selected ? 'drop-shadow(0 4px 4px rgba(0,0,0,0.35))' : undefined,
      }}
    >
      <rect
        x={1}
        y={1}
        width={width - 2}
        height={height - 2}
        rx={6}
        fill="#faf6ec"
        stroke={selected ? '#f39c12' : '#333'}
        strokeWidth={selected ? 3 : 1.5}
      />
      <text
        x={width / 2}
        y={height * 0.52}
        textAnchor="middle"
        fontSize={width * 0.42}
        fontWeight={700}
        fill={color}
      >
        {numberLabel}
      </text>
      <text
        x={width / 2}
        y={height * 0.8}
        textAnchor="middle"
        fontSize={width * 0.22}
        fill={color}
      >
        {suitLabel}
      </text>
    </svg>
  );
}
