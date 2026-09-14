export interface PipPoint {
  /** 0~1 사이 상대 좌표 (타일 안쪽 여백 기준) */
  x: number;
  y: number;
}

const COL = { L: 0.22, C: 0.5, R: 0.78 };
const ROW = { T: 0.2, M: 0.5, B: 0.8 };

const GRID = {
  TL: { x: COL.L, y: ROW.T },
  TC: { x: COL.C, y: ROW.T },
  TR: { x: COL.R, y: ROW.T },
  ML: { x: COL.L, y: ROW.M },
  MC: { x: COL.C, y: ROW.M },
  MR: { x: COL.R, y: ROW.M },
  BL: { x: COL.L, y: ROW.B },
  BC: { x: COL.C, y: ROW.B },
  BR: { x: COL.R, y: ROW.B },
} satisfies Record<string, PipPoint>;

/**
 * 통수/삭수 패의 숫자별 점(핍) 배치. 실제 마작패의 일반적인 점 배열 관례를
 * (특정 브랜드 도안을 베끼지 않고) 격자 좌표로 재구성한 것이다.
 */
export const PIP_LAYOUTS: Record<number, PipPoint[]> = {
  1: [GRID.MC],
  2: [GRID.TR, GRID.BL],
  3: [GRID.TL, GRID.MC, GRID.BR],
  4: [GRID.TL, GRID.TR, GRID.BL, GRID.BR],
  5: [GRID.TL, GRID.TR, GRID.BL, GRID.BR, GRID.MC],
  6: [GRID.TL, GRID.ML, GRID.BL, GRID.TR, GRID.MR, GRID.BR],
  7: [GRID.TL, GRID.TC, GRID.TR, GRID.ML, GRID.MR, GRID.BL, GRID.BR],
  8: [GRID.TL, GRID.TC, GRID.TR, GRID.ML, GRID.MR, GRID.BL, GRID.BC, GRID.BR],
  9: [GRID.TL, GRID.TC, GRID.TR, GRID.ML, GRID.MC, GRID.MR, GRID.BL, GRID.BC, GRID.BR],
};

/** 통수 핍 색상(전통적으로 파랑/빨강/초록이 섞여 표현된다) */
export const PIN_PIP_COLORS = ['#2471a3', '#c0392b', '#1e8449'];
