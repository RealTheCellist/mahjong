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
const HANZI_FONT =
  "'Noto Serif TC', 'Songti TC', 'PingFang TC', 'Microsoft JhengHei', 'Noto Serif CJK TC', serif";

interface EngravedTextProps {
  x: number;
  y: number;
  fontSize: number;
  fill: string;
  children: string;
}

/** 잉크로 새긴 듯한 음각 느낌을 주기 위해 그림자/하이라이트를 겹쳐 그린다 */
function EngravedText({ x, y, fontSize, fill, children }: EngravedTextProps) {
  const offset = fontSize * 0.02;
  const shared = {
    x,
    y,
    textAnchor: 'middle' as const,
    fontSize,
    fontFamily: HANZI_FONT,
    fontWeight: 700,
  };
  return (
    <>
      <text {...shared} x={x - offset} y={y - offset} fill="#ffffff" opacity={0.55}>
        {children}
      </text>
      <text {...shared} x={x + offset} y={y + offset} fill="#000000" opacity={0.3}>
        {children}
      </text>
      <text {...shared} fill={fill}>
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
        <radialGradient id={`${gradientId}-pinOuter`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
          <stop offset="30%" stopColor="currentColor" stopOpacity={0.75} />
          <stop offset="100%" stopColor="currentColor" />
        </radialGradient>
        <radialGradient id={`${gradientId}-bamboo`} cx="30%" cy="20%" r="90%">
          <stop offset="0%" stopColor="#6fce8f" />
          <stop offset="55%" stopColor="#2f9e5c" />
          <stop offset="100%" stopColor="#1c6b3f" />
        </radialGradient>
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
        rx={width * 0.1}
        fill={`url(#${gradientId}-bg)`}
        stroke={selected ? '#f39c12' : '#a99a70'}
        strokeWidth={selected ? 3 : 1.2}
      />
      <rect
        x={2.5}
        y={2.5}
        width={width - 5}
        height={height - 5}
        rx={width * 0.08}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.5}
        strokeWidth={0.8}
      />

      {suit === 'm' && (
        <>
          <EngravedText x={width / 2} y={height * 0.42} fontSize={width * 0.46} fill="#a8281f">
            {hanziNumeral ?? ''}
          </EngravedText>
          <EngravedText x={width / 2} y={height * 0.78} fontSize={width * 0.34} fill="#161616">
            萬
          </EngravedText>
        </>
      )}

      {suit === 'z' && (
        <EngravedText x={width / 2} y={height * 0.62} fontSize={width * 0.54} fill={color}>
          {honorChar ?? ''}
        </EngravedText>
      )}

      {suit === 'p' &&
        PIP_LAYOUTS[number].map((pip, i) => {
          const r = width * 0.135;
          const cx = width * 0.08 + pip.x * width * 0.84;
          const cy = height * 0.08 + pip.y * height * 0.84;
          const pipColor = PIN_PIP_COLORS[i % PIN_PIP_COLORS.length];
          return (
            <g key={i} color={pipColor}>
              <circle cx={cx} cy={cy} r={r} fill={`url(#${gradientId}-pinOuter)`} stroke={pipColor} strokeWidth={width * 0.018} />
              <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke="#ffffff" strokeOpacity={0.85} strokeWidth={width * 0.012} />
              <circle cx={cx} cy={cy} r={r * 0.28} fill={pipColor} opacity={0.9} />
            </g>
          );
        })}

      {suit === 's' &&
        PIP_LAYOUTS[number].map((pip, i) => {
          const stickW = width * 0.15;
          const stickH = height * 0.23;
          const cx = width * 0.08 + pip.x * width * 0.84;
          const cy = height * 0.08 + pip.y * height * 0.84;
          const knobR = stickW * 0.5;
          return (
            <g key={i}>
              <rect
                x={cx - stickW * 0.18}
                y={cy - stickH / 2 + knobR * 0.6}
                width={stickW * 0.36}
                height={stickH - knobR * 1.2}
                fill="#1c6b3f"
              />
              <circle cx={cx} cy={cy - stickH / 2 + knobR * 0.6} r={knobR} fill={`url(#${gradientId}-bamboo)`} stroke="#164f2e" strokeWidth={width * 0.012} />
              <circle cx={cx} cy={cy + stickH / 2 - knobR * 0.6} r={knobR} fill={`url(#${gradientId}-bamboo)`} stroke="#164f2e" strokeWidth={width * 0.012} />
              <rect x={cx - stickW * 0.3} y={cy - width * 0.012} width={stickW * 0.6} height={width * 0.024} fill="#164f2e" opacity={0.7} />
            </g>
          );
        })}

      <text x={width * 0.1} y={height * 0.16} fontSize={width * 0.15} fill="#9a9070">
        {suit === 'z' ? '' : `${number}${suitLabel}`}
      </text>
    </svg>
  );
}
