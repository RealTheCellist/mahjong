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
/** 실물 패의 두께감을 표현하는 입체 깊이 (타일 너비 대비 비율) */
const DEPTH_RATIO = 0.11;
/** 관동체(関東判) 스타일: 붓글씨체가 아닌 정자체(正字體, 해서/명조 계열의 반듯한 표준 글꼴) */
const HANZI_FONT =
  "'Noto Serif TC', 'Songti TC', 'PMingLiU', 'Microsoft JhengHei', 'Noto Serif CJK TC', serif";

interface PrintedTextProps {
  x: number;
  y: number;
  fontSize: number;
  fill: string;
  children: string;
}

/** 관동체 특유의 또렷하고 납작한 인쇄체 느낌 — 옅은 그림자 한 겹만 깔아 살짝의 눌림감만 준다 */
function PrintedText({ x, y, fontSize, fill, children }: PrintedTextProps) {
  const offset = fontSize * 0.015;
  const shared = {
    x,
    textAnchor: 'middle' as const,
    fontSize,
    fontFamily: HANZI_FONT,
    fontWeight: 700,
  };
  return (
    <>
      <text {...shared} y={y + offset} fill="#000000" opacity={0.25}>
        {children}
      </text>
      <text {...shared} y={y} fill={fill}>
        {children}
      </text>
    </>
  );
}

export function Tile({ index, selected = false, onClick, width = 44 }: TileProps) {
  const display = getTileDisplay(index);
  const { suit, number, numberLabel, suitLabel, color, hanziNumeral, honorChar } = display;
  const height = width * HEIGHT_RATIO;
  const depth = width * DEPTH_RATIO;
  const totalWidth = width + depth;
  const totalHeight = height + depth;
  const gradientId = useId();

  const ariaLabel = suit === 'z' ? `${numberLabel}(자패)` : numberLabel;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width={totalWidth}
      height={totalHeight}
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
          ? 'drop-shadow(0 6px 4px rgba(0,0,0,0.35))'
          : 'drop-shadow(0 2px 2px rgba(0,0,0,0.25))',
      }}
    >
      <defs>
        <linearGradient id={`${gradientId}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffdf8" />
          <stop offset="60%" stopColor="#f8f2e2" />
          <stop offset="100%" stopColor="#ece1c4" />
        </linearGradient>
        <linearGradient id={`${gradientId}-side`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d9cca4" />
          <stop offset="100%" stopColor="#b8a76f" />
        </linearGradient>
        <linearGradient id={`${gradientId}-bottom`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9b985" />
          <stop offset="100%" stopColor="#a4925c" />
        </linearGradient>
      </defs>

      {/* 오른쪽 옆면(두께) — 실물 패의 입체감 */}
      <polygon
        points={`${width},2 ${totalWidth},${depth + 2} ${totalWidth},${totalHeight - 2} ${width},${height - 2}`}
        fill={`url(#${gradientId}-side)`}
        stroke="#8f7f4d"
        strokeWidth={0.6}
      />
      {/* 아랫면(두께) */}
      <polygon
        points={`2,${height} ${depth + 2},${totalHeight} ${totalWidth - 2},${totalHeight} ${width - 2},${height}`}
        fill={`url(#${gradientId}-bottom)`}
        stroke="#8f7f4d"
        strokeWidth={0.6}
      />

      <rect
        x={1}
        y={1}
        width={width - 2}
        height={height - 2}
        rx={width * 0.08}
        fill={`url(#${gradientId}-bg)`}
        stroke={selected ? '#f39c12' : '#a99a70'}
        strokeWidth={selected ? 3 : 1.2}
      />
      <rect
        x={2.5}
        y={2.5}
        width={width - 5}
        height={height - 5}
        rx={width * 0.06}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.5}
        strokeWidth={0.8}
      />

      {suit === 'm' && (
        <>
          <PrintedText x={width / 2} y={height * 0.42} fontSize={width * 0.46} fill="#c0392b">
            {hanziNumeral ?? ''}
          </PrintedText>
          <PrintedText x={width / 2} y={height * 0.78} fontSize={width * 0.34} fill="#161616">
            萬
          </PrintedText>
        </>
      )}

      {suit === 'z' && (
        <PrintedText x={width / 2} y={height * 0.62} fontSize={width * 0.54} fill={color}>
          {honorChar ?? ''}
        </PrintedText>
      )}

      {suit === 'p' &&
        PIP_LAYOUTS[number].map((pip, i) => {
          const r = width * 0.135;
          const cx = width * 0.08 + pip.x * width * 0.84;
          const cy = height * 0.08 + pip.y * height * 0.84;
          const pipColor = PIN_PIP_COLORS[i % PIN_PIP_COLORS.length];
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={r} fill={pipColor} />
              <circle cx={cx} cy={cy} r={r * 0.6} fill="none" stroke="#ffffff" strokeWidth={width * 0.02} />
            </g>
          );
        })}

      {suit === 's' &&
        PIP_LAYOUTS[number].map((pip, i) => {
          const stickW = width * 0.15;
          const stickH = height * 0.24;
          const cx = width * 0.08 + pip.x * width * 0.84;
          const cy = height * 0.08 + pip.y * height * 0.84;
          return (
            <g key={i}>
              <rect
                x={cx - stickW / 2}
                y={cy - stickH / 2}
                width={stickW}
                height={stickH}
                rx={stickW * 0.15}
                fill="#1e8449"
              />
              <rect
                x={cx - stickW / 2}
                y={cy - width * 0.012}
                width={stickW}
                height={width * 0.024}
                fill="#ffffff"
                opacity={0.8}
              />
            </g>
          );
        })}

      <text x={width * 0.1} y={height * 0.16} fontSize={width * 0.15} fill="#9a9070">
        {suit === 'z' ? '' : `${number}${suitLabel}`}
      </text>
    </svg>
  );
}
