import { useId } from 'react';
import { getTileDisplay } from '../ui/tileDisplay';
import { PIN_PIP_COLORS, PIP_LAYOUTS } from '../ui/pipLayout';

interface TileProps {
  index: number;
  selected?: boolean;
  onClick?: (index: number) => void;
  width?: number;
}

const HEIGHT_RATIO = 1.4;

export function Tile({ index, selected = false, onClick, width = 44 }: TileProps) {
  const display = getTileDisplay(index);
  const { suit, number, numberLabel, suitLabel, color, hanziNumeral, honorChar } = display;
  const height = width * HEIGHT_RATIO;
  const gradientId = useId();

  const ariaLabel = suit === 'z' ? `${numberLabel}(자패)` : numberLabel;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
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
        transform: selected ? 'translateY(-8px)' : undefined,
        transition: 'transform 120ms ease',
        filter: selected
          ? 'drop-shadow(0 4px 4px rgba(0,0,0,0.35))'
          : 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))',
      }}
    >
      <defs>
        <linearGradient id={`${gradientId}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#faf6ea" />
          <stop offset="100%" stopColor="#efe6cf" />
        </linearGradient>
        <radialGradient id={`${gradientId}-pin`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.85} />
          <stop offset="18%" stopColor="currentColor" stopOpacity={0.85} />
          <stop offset="100%" stopColor="currentColor" />
        </radialGradient>
      </defs>

      <rect
        x={1}
        y={1}
        width={width - 2}
        height={height - 2}
        rx={width * 0.14}
        fill={`url(#${gradientId}-bg)`}
        stroke={selected ? '#f39c12' : '#b8ac8a'}
        strokeWidth={selected ? 3 : 1.2}
      />
      <rect
        x={width * 0.08}
        y={height * 0.05}
        width={width * 0.84}
        height={height * 0.03}
        rx={width * 0.02}
        fill="#ffffff"
        opacity={0.6}
      />

      {suit === 'm' && (
        <>
          <text
            x={width / 2}
            y={height * 0.42}
            textAnchor="middle"
            fontSize={width * 0.46}
            fontWeight={700}
            fill="#c0392b"
          >
            {hanziNumeral}
          </text>
          <text
            x={width / 2}
            y={height * 0.78}
            textAnchor="middle"
            fontSize={width * 0.34}
            fontWeight={700}
            fill="#1c1c1c"
          >
            萬
          </text>
        </>
      )}

      {suit === 'z' && (
        <text
          x={width / 2}
          y={height * 0.6}
          textAnchor="middle"
          fontSize={width * 0.52}
          fontWeight={700}
          fill={color}
        >
          {honorChar}
        </text>
      )}

      {suit === 'p' &&
        PIP_LAYOUTS[number].map((pip, i) => {
          const r = width * 0.13;
          const cx = width * 0.08 + pip.x * width * 0.84;
          const cy = height * 0.08 + pip.y * height * 0.84;
          const pipColor = PIN_PIP_COLORS[i % PIN_PIP_COLORS.length];
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill={`url(#${gradientId}-pin)`}
              stroke={pipColor}
              color={pipColor}
              strokeWidth={width * 0.02}
            />
          );
        })}

      {suit === 's' &&
        PIP_LAYOUTS[number].map((pip, i) => {
          const stickW = width * 0.14;
          const stickH = height * 0.22;
          const cx = width * 0.08 + pip.x * width * 0.84;
          const cy = height * 0.08 + pip.y * height * 0.84;
          return (
            <g key={i}>
              <rect
                x={cx - stickW / 2}
                y={cy - stickH / 2}
                width={stickW}
                height={stickH}
                rx={stickW * 0.4}
                fill="#2f9e5c"
                stroke="#1e7a44"
                strokeWidth={width * 0.015}
              />
              <rect x={cx - stickW / 2} y={cy - stickW * 0.15} width={stickW} height={stickW * 0.3} fill="#1e7a44" />
            </g>
          );
        })}

      <text x={width * 0.1} y={height * 0.16} fontSize={width * 0.16} fill="#8a8168">
        {suit === 'z' ? '' : `${number}${suitLabel}`}
      </text>
    </svg>
  );
}
