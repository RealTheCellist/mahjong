import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Tile } from '../components/Tile';
import { INTRO_APP_NAME } from '../branding';
import {
  dealGame,
  drawTile,
  discardTile,
  canTsumo,
  canRon,
  applyTsumo,
  applyRon,
  isTenpaiAfterDiscard,
  canCallPonOn,
  canCallKanOn,
  canCallChiOn,
  callPon,
  callChi,
  callMinkan,
  callAnkan,
  bumpHand,
} from '../game/gameEngine';
import {
  decideAiDiscard,
  decideAiTsumo,
  decideAiRon,
  decideAiPon,
  decideAiChi,
  decideAiKan,
  decideAiAnkan,
} from '../game/aiPlayer';
import type { AiLevel, GameState } from '../game/types';
import type { Meld, Hand34 } from '../engine/types';
import { tileIndexToName, tileSuitAndValue } from '../engine/tileCodec';
import { createEmptyHand34 } from '../engine/types';
import { findAnkanCandidates } from '../engine/calls';
import { calculateShanten } from '../engine/shanten';
import { findWaits } from '../engine/waits';
import { calculateScore, type ScoreResult } from '../engine/scoring';
import { expandHand34 } from '../ui/tileDisplay';

const HUMAN_SEAT = 0;
const AI_STEP_DELAY_MS = 650;
const DESIGN_W = 1334;
const DESIGN_H = 750;

const SERIF = "'Noto Serif KR', serif";
const SANS = "'Noto Sans KR', sans-serif";

const SEAT_LABELS = ['나', '오른쪽', '맞은편', '왼쪽'];
const WIND_NAMES: Record<number, string> = { 27: '東', 28: '南', 29: '西', 30: '北' };

// 디자인 핸드오프(design_handoff_mahjong_practice)의 토큰을 그대로 옮긴 팔레트
const T = {
  screenBg: 'radial-gradient(120% 90% at 50% 10%, #2b2320 0%, #15110f 70%)',
  railBg: 'linear-gradient(180deg,#1d1815,#141110)',
  railBorder: '#2a231e',
  iconBg: '#262019',
  iconBorder: '#3a3027',
  iconGlyph: '#bfae92',
  turnLabel: '#7d7264',
  turnValue: '#e9d7ae',
  tableBg: 'radial-gradient(70% 70% at 50% 45%, #14503f 0%, #0e3a2e 60%, #0a2c23 100%)',
  tableShadow: 'inset 0 0 0 10px #1b1410, inset 0 0 60px rgba(0,0,0,.55), 0 18px 40px rgba(0,0,0,.5)',
  centerPanelBg: 'linear-gradient(180deg,#1c1613,#120e0c)',
  centerPanelShadow: 'inset 0 0 0 1px #3b2f25, 0 8px 20px rgba(0,0,0,.5)',
  gold900: '#f0dcb0',
  muted: '#9a8d78',
  faint: '#7f7463',
  faint2: '#6f6455',
  mint: '#8fd6b0',
  warn: '#d98f6a',
  goldText: '#e9c97f',
  cream: '#e8ddc4',
  creamStrong: '#f4e6c6',
  bodyText: '#e6dcc7',
  backGradient: 'linear-gradient(180deg,#3f7f66,#255745)',
  backGradientH: 'linear-gradient(90deg,#3f7f66,#255745)',
  backGradientHR: 'linear-gradient(270deg,#3f7f66,#255745)',
  backBorder: '#1c4436',
  fadeBottom: 'linear-gradient(180deg,rgba(16,13,11,0),#14100e 40%)',
  panelBg: 'linear-gradient(180deg,#1b1613,#131010)',
  panelBorder: '#2a231e',
  cardBg: '#221b16',
  cardBorder: '#33291f',
  ctaGold: 'linear-gradient(180deg,#e0b463,#c4913f)',
  ctaGoldText: '#221a10',
  pillBg: '#2a231c',
  pillBorder: '#3d332a',
  pillText: '#b3a894',
  riichiBg: 'linear-gradient(180deg,#3b3227,#2a2219)',
  riichiBorder: '#6d5a3c',
  riichiText: '#e9cf98',
};

function seatOffset(seat: number): number {
  return (seat - HUMAN_SEAT + 4) % 4;
}

/** 버림패가 많이 쌓여도(장기전) 배정된 영역을 벗어나 다른 요소와 겹치지 않도록 매수에 따라 타일 폭을 줄인다 */
function pondTileWidth(count: number): number {
  if (count <= 12) return 29;
  if (count <= 18) return 24;
  if (count <= 24) return 20;
  return 16;
}

/** 1334×750 고정 디자인 캔버스를 컨테이너 폭에 맞춰 스케일한다 */
function useCanvasScale(designWidth: number): { wrapRef: React.RefObject<HTMLDivElement | null>; scale: number } {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / designWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth]);
  return { wrapRef, scale };
}

type PendingReaction =
  | { type: 'ron'; seat: number }
  | { type: 'call'; seat: number; canPon: boolean; canKan: boolean }
  | { type: 'chi'; seat: number; options: [number, number][] };

type AssistPreview =
  | { kind: 'shanten'; shanten: number }
  | { kind: 'score'; waitTile: number; isTsumo: boolean; score: ScoreResult };

/** 사람 플레이어가 실제로 볼 수 있는 패만 집계한다(상대 손패는 절대 포함하지 않는다) */
function buildVisibleForAssist(state: GameState): Hand34 {
  const visible = createEmptyHand34();
  for (const p of state.players) {
    if (p.isHuman) for (let t = 0; t < 34; t += 1) visible[t] += p.hand[t];
    for (const d of p.discards) visible[d] += 1;
    for (const m of p.melds) for (const t of m.tiles) visible[t] += 1;
  }
  for (const d of state.doraIndicators) visible[d] += 1;
  return visible;
}

function suitRemainingCounts(visible: Hand34): { m: number; p: number; s: number; z: number } {
  const totals = { m: 36, p: 36, s: 36, z: 28 };
  const seen = { m: 0, p: 0, s: 0, z: 0 };
  for (let t = 0; t < 34; t += 1) {
    seen[tileSuitAndValue(t).suit] += visible[t];
  }
  return {
    m: totals.m - seen.m,
    p: totals.p - seen.p,
    s: totals.s - seen.s,
    z: totals.z - seen.z,
  };
}

function rankBadge(han: number, fu: number): string | null {
  if (han >= 13) return '역만';
  if (han >= 11) return '삼배만';
  if (han >= 8) return '배만';
  if (han >= 6) return '하네만';
  if (fu * 2 ** (2 + han) >= 2000) return '만관';
  return null;
}

const cardStyle: CSSProperties = {
  borderRadius: 12,
  background: T.cardBg,
  border: `1px solid ${T.cardBorder}`,
  padding: '12px 13px',
  display: 'flex',
  flexDirection: 'column',
  gap: 9,
};

const cardHeaderStyle: CSSProperties = { fontSize: 12, letterSpacing: '.06em', color: T.muted };

function MeldRow({ melds, width = 18 }: { melds: Meld[]; width?: number }) {
  if (melds.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {melds.map((m, i) => (
        <div key={i} style={{ display: 'flex', gap: 1 }}>
          {m.tiles.map((t, j) => (
            <Tile key={j} index={t} width={width} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PracticeGameScreen() {
  const [aiLevels, setAiLevels] = useState<[AiLevel, AiLevel, AiLevel]>(['normal', 'normal', 'normal']);
  const [state, setState] = useState<GameState | null>(null);
  const [startingScores, setStartingScores] = useState<number[]>([]);
  const [pendingReaction, setPendingReaction] = useState<PendingReaction | null>(null);
  const [declinedSeats, setDeclinedSeats] = useState<Set<number>>(new Set());
  const [selectedDiscard, setSelectedDiscard] = useState<number | null>(null);
  const { wrapRef, scale } = useCanvasScale(DESIGN_W);

  const startGame = () => {
    const fresh = dealGame({ humanSeat: HUMAN_SEAT, aiLevels });
    setState(fresh);
    setStartingScores(fresh.players.map((p) => p.score));
    setPendingReaction(null);
    setDeclinedSeats(new Set());
    setSelectedDiscard(null);
  };

  useEffect(() => {
    setDeclinedSeats(new Set());
  }, [state?.lastDiscard]);

  useEffect(() => {
    setSelectedDiscard(null);
  }, [state?.turnCount]);

  // 자동 진행: AI 차례의 안깡/쯔모/버림 판단, 그리고 버림 이후의 론>퐁·깡>치 순 리액션 처리
  useEffect(() => {
    if (!state || state.phase === 'ended' || pendingReaction) return;

    if (state.phase === 'discard') {
      const player = state.players[state.currentSeat];
      if (player.isHuman) return;

      const timer = setTimeout(() => {
        if (canTsumo(state) && decideAiTsumo()) {
          setState(applyTsumo(state));
          return;
        }
        const ankanTile = decideAiAnkan(state, state.currentSeat);
        if (ankanTile !== null) {
          setState(callAnkan(state, ankanTile));
          return;
        }
        const { tile, declareRiichi } = decideAiDiscard(state, state.currentSeat);
        setState(discardTile(state, tile, { declareRiichi }));
      }, AI_STEP_DELAY_MS);
      return () => clearTimeout(timer);
    }

    if (state.phase === 'draw') {
      const order = [0, 1, 2].map((o) => (state.currentSeat + o) % 4);

      for (const seat of order) {
        if (declinedSeats.has(seat) || !canRon(state, seat)) continue;
        if (state.players[seat].isHuman) {
          setPendingReaction({ type: 'ron', seat });
          return;
        }
        if (decideAiRon()) {
          const timer = setTimeout(() => setState(applyRon(state, seat)), AI_STEP_DELAY_MS);
          return () => clearTimeout(timer);
        }
      }

      for (const seat of order) {
        if (declinedSeats.has(seat)) continue;
        const kanOk = canCallKanOn(state, seat);
        const ponOk = canCallPonOn(state, seat);
        if (!kanOk && !ponOk) continue;
        if (state.players[seat].isHuman) {
          setPendingReaction({ type: 'call', seat, canPon: ponOk, canKan: kanOk });
          return;
        }
        if (kanOk && decideAiKan(state, seat)) {
          const timer = setTimeout(() => setState(callMinkan(state, seat)), AI_STEP_DELAY_MS);
          return () => clearTimeout(timer);
        }
        if (ponOk && decideAiPon(state, seat)) {
          const timer = setTimeout(() => setState(callPon(state, seat)), AI_STEP_DELAY_MS);
          return () => clearTimeout(timer);
        }
      }

      const chiSeat = state.currentSeat;
      if (!declinedSeats.has(chiSeat)) {
        const chiOptions = canCallChiOn(state, chiSeat);
        if (chiOptions.length > 0) {
          if (state.players[chiSeat].isHuman) {
            setPendingReaction({ type: 'chi', seat: chiSeat, options: chiOptions });
            return;
          }
          const aiChoice = decideAiChi(state, chiSeat);
          if (aiChoice) {
            const timer = setTimeout(() => setState(callChi(state, chiSeat, aiChoice)), AI_STEP_DELAY_MS);
            return () => clearTimeout(timer);
          }
        }
      }

      const timer = setTimeout(() => setState(drawTile(state)), AI_STEP_DELAY_MS - 250);
      return () => clearTimeout(timer);
    }
  }, [state, pendingReaction, declinedSeats]);

  if (!state) {
    return (
      <section style={{ padding: 24, maxWidth: 640, margin: '0 auto', fontFamily: SANS }}>
        <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>{INTRO_APP_NAME}</div>
        <h1>연습 게임</h1>
        <p>AI 3명과 실전처럼 한 판을 플레이합니다. 상대의 난이도를 선택하세요.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {([0, 1, 2] as const).map((i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              상대 {i + 1} 난이도:
              <select
                value={aiLevels[i]}
                onChange={(e) => {
                  const next = [...aiLevels] as [AiLevel, AiLevel, AiLevel];
                  next[i] = e.target.value as AiLevel;
                  setAiLevels(next);
                }}
              >
                <option value="easy">초급 (실수가 잦고 방어를 잘 안 함)</option>
                <option value="normal">중급 (준수한 효율, 리치 상대 방어)</option>
                <option value="hard">고급 (거의 최선수, 적극적 리치와 방어)</option>
              </select>
            </label>
          ))}
        </div>
        <button type="button" onClick={startGame}>
          게임 시작
        </button>
      </section>
    );
  }

  const human = state.players[HUMAN_SEAT];
  const rightOpponent = state.players[(HUMAN_SEAT + 1) % 4]; // 下家
  const acrossOpponent = state.players[(HUMAN_SEAT + 2) % 4]; // 対面
  const leftOpponent = state.players[(HUMAN_SEAT + 3) % 4]; // 上家

  const handleSelectDiscard = (tileIndex: number) => setSelectedDiscard(tileIndex);

  const confirmDiscard = (declareRiichi: boolean) => {
    if (selectedDiscard === null) return;
    setState(discardTile(state, selectedDiscard, { declareRiichi }));
    setSelectedDiscard(null);
  };

  const handleHumanTsumo = () => setState(applyTsumo(state));
  const handleHumanAnkan = (tile: number) => setState(callAnkan(state, tile));

  const handleHumanRon = () => {
    if (pendingReaction?.type !== 'ron') return;
    setState(applyRon(state, pendingReaction.seat));
    setPendingReaction(null);
  };
  const handleHumanCallPon = () => {
    if (pendingReaction?.type !== 'call') return;
    setState(callPon(state, pendingReaction.seat));
    setPendingReaction(null);
  };
  const handleHumanCallKan = () => {
    if (pendingReaction?.type !== 'call') return;
    setState(callMinkan(state, pendingReaction.seat));
    setPendingReaction(null);
  };
  const handleHumanCallChi = (option: [number, number]) => {
    if (pendingReaction?.type !== 'chi') return;
    setState(callChi(state, pendingReaction.seat, option));
    setPendingReaction(null);
  };
  const handleSkipReaction = () => {
    if (!pendingReaction) return;
    setDeclinedSeats((prev) => new Set(prev).add(pendingReaction.seat));
    setPendingReaction(null);
  };

  const canRiichiOnSelected =
    selectedDiscard !== null &&
    !human.isRiichi &&
    human.score >= 1000 &&
    isTenpaiAfterDiscard(human.hand, selectedDiscard);

  const ankanCandidates =
    state.phase === 'discard' && state.currentSeat === HUMAN_SEAT ? findAnkanCandidates(human.hand) : [];

  const isMyDiscardTurn = state.phase === 'discard' && state.currentSeat === HUMAN_SEAT;
  const drawnTile = isMyDiscardTurn ? state.lastDraw : undefined;
  const baseHandTiles = expandHand34(human.hand);
  if (drawnTile !== undefined) {
    const idxInList = baseHandTiles.indexOf(drawnTile);
    if (idxInList !== -1) baseHandTiles.splice(idxInList, 1);
  }

  // 역 미리보기: 실제 쯔모 가능 상태 > 선택한 버림 후보 기준 > 대기 중인 손패 기준 순으로 계산한다.
  // 상대의 손패는 절대 들여다보지 않고, 실제 엔진 계산 결과만 사용한다(추측/가상의 수치 없음).
  let assistPreview: AssistPreview | null = null;
  if (isMyDiscardTurn && drawnTile !== undefined && canTsumo(state)) {
    const score = calculateScore(human.hand, {
      winTile: drawnTile,
      isTsumo: true,
      isDealer: human.seat === state.dealerSeat,
      isRiichi: human.isRiichi,
      seatWind: human.seatWind,
      roundWind: state.roundWind,
      doraIndicators: state.doraIndicators,
      melds: human.melds,
    });
    assistPreview = { kind: 'score', waitTile: drawnTile, isTsumo: true, score };
  } else {
    const hand13 = isMyDiscardTurn
      ? selectedDiscard !== null
        ? bumpHand(human.hand, selectedDiscard, -1)
        : null
      : human.hand;
    if (hand13) {
      const shanten = calculateShanten(hand13);
      if (shanten > 0) {
        assistPreview = { kind: 'shanten', shanten };
      } else {
        const waits = findWaits(hand13);
        if (waits.length > 0) {
          const waitTile = waits[0];
          const testHand = bumpHand(hand13, waitTile, 1);
          try {
            const score = calculateScore(testHand, {
              winTile: waitTile,
              isTsumo: false,
              isDealer: human.seat === state.dealerSeat,
              isRiichi: human.isRiichi,
              seatWind: human.seatWind,
              roundWind: state.roundWind,
              doraIndicators: state.doraIndicators,
              melds: human.melds,
            });
            assistPreview = { kind: 'score', waitTile, isTsumo: false, score };
          } catch {
            assistPreview = null;
          }
        }
      }
    }
  }

  const visibleForAssist = buildVisibleForAssist(state);
  const remainingCounts = suitRemainingCounts(visibleForAssist);
  const waitRemaining =
    assistPreview?.kind === 'score' ? 4 - visibleForAssist[assistPreview.waitTile] : null;

  const overlayActive = pendingReaction !== null;

  return (
    <section style={{ padding: '16px 16px 32px', maxWidth: DESIGN_W, margin: '0 auto', fontFamily: SANS }}>
      <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>{INTRO_APP_NAME}</div>
      <h1>연습 게임</h1>

      <div ref={wrapRef} style={{ width: '100%', position: 'relative', borderRadius: 22, overflow: 'hidden' }}>
        <div style={{ height: DESIGN_H * scale }} />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: DESIGN_W,
            height: DESIGN_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            background: T.screenBg,
            display: 'flex',
            color: T.bodyText,
          }}
        >
          {/* 좌측 레일 */}
          <div
            style={{
              width: 64,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 0',
              background: T.railBg,
              borderRight: `1px solid ${T.railBorder}`,
              boxSizing: 'border-box',
            }}
          >
            <button
              type="button"
              onClick={() => setState(null)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: T.iconBg,
                border: `1px solid ${T.iconBorder}`,
                color: T.iconGlyph,
                fontSize: 17,
                cursor: 'pointer',
              }}
              title="새 게임"
            >
              ‹
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 10, color: T.turnLabel, letterSpacing: '.08em' }}>TURN</div>
              <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 900, color: T.turnValue }}>
                {String(state.turnCount).padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* 중앙 플레이 영역 */}
          <div style={{ position: 'relative', flex: 1 }}>
            <div
              style={{
                position: 'absolute',
                left: 170,
                top: 16,
                width: 600,
                height: 600,
                borderRadius: 26,
                background: T.tableBg,
                boxShadow: T.tableShadow,
              }}
            />

            {/* 중앙 정보판 */}
            <div
              style={{
                position: 'absolute',
                left: 390,
                top: 216,
                width: 200,
                height: 200,
                borderRadius: 14,
                background: T.centerPanelBg,
                boxShadow: T.centerPanelShadow,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 900, color: T.gold900, letterSpacing: '.04em' }}>
                {WIND_NAMES[state.roundWind]}１局
              </div>
              {state.riichiSticks > 0 && (
                <div style={{ fontSize: 12, color: T.muted }}>공탁 {state.riichiSticks * 1000}</div>
              )}
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ fontSize: 10, letterSpacing: '.14em', color: T.faint }}>남은 패</div>
                <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 900, color: T.mint, lineHeight: 1 }}>
                  {state.wall.length}
                </div>
              </div>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 10, letterSpacing: '.1em', color: T.faint }}>도라</span>
                {state.doraIndicators.map((t, i) => (
                  <Tile key={i} index={t} width={26} />
                ))}
              </div>
            </div>

            {/* 점수 칩 (대면/자기/상가/하가) */}
            <div style={{ position: 'absolute', left: 190, top: 36, width: 118, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 12, color: acrossOpponent.seat === state.dealerSeat ? T.warn : T.muted }}>
                対面 · {WIND_NAMES[acrossOpponent.seatWind]}
                {acrossOpponent.seat === state.dealerSeat ? ' (친)' : ''}
              </span>
              <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 900, color: T.cream }}>
                {acrossOpponent.score.toLocaleString()}
              </span>
            </div>
            <div style={{ position: 'absolute', left: 390, top: 536, width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 12, color: T.goldText }}>
                나 · {WIND_NAMES[human.seatWind]}
                {human.seat === state.dealerSeat ? ' (친)' : ''}
              </span>
              <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 900, color: T.creamStrong }}>
                {human.score.toLocaleString()}
              </span>
            </div>
            <div style={{ position: 'absolute', left: 196, top: 300, width: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 12, color: leftOpponent.seat === state.dealerSeat ? T.warn : T.muted }}>
                上家 · {WIND_NAMES[leftOpponent.seatWind]}
                {leftOpponent.seat === state.dealerSeat ? ' (친)' : ''}
              </span>
              <span style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 900, color: T.cream }}>
                {leftOpponent.score.toLocaleString()}
              </span>
            </div>
            <div style={{ position: 'absolute', left: 664, top: 300, width: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 12, color: rightOpponent.seat === state.dealerSeat ? T.warn : T.muted }}>
                下家 · {WIND_NAMES[rightOpponent.seatWind]}
                {rightOpponent.seat === state.dealerSeat ? ' (친)' : ''}
              </span>
              <span style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 900, color: T.cream }}>
                {rightOpponent.score.toLocaleString()}
              </span>
            </div>

            {/* 버림패 풀 (4방향) */}
            <div style={{ position: 'absolute', left: 390, top: 428, width: 198, maxHeight: 100, overflow: 'hidden', display: 'flex', flexWrap: 'wrap', gap: 3, alignContent: 'flex-start' }}>
              {human.discards.map((t, i) => (
                <Tile key={i} index={t} width={pondTileWidth(human.discards.length)} />
              ))}
            </div>
            <div style={{ position: 'absolute', left: 390, top: 96, width: 198, maxHeight: 100, overflow: 'hidden', display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'flex-end', alignContent: 'flex-end' }}>
              {acrossOpponent.discards.map((t, i) => (
                <Tile key={i} index={t} width={pondTileWidth(acrossOpponent.discards.length)} />
              ))}
            </div>
            <div style={{ position: 'absolute', left: 258, top: 216, width: 126, maxHeight: 196, overflow: 'hidden', display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'flex-end', alignContent: 'flex-start' }}>
              {leftOpponent.discards.map((t, i) => (
                <Tile key={i} index={t} width={pondTileWidth(leftOpponent.discards.length)} />
              ))}
            </div>
            <div style={{ position: 'absolute', left: 596, top: 216, width: 126, maxHeight: 196, overflow: 'hidden', display: 'flex', flexWrap: 'wrap', gap: 3, alignContent: 'flex-start' }}>
              {rightOpponent.discards.map((t, i) => (
                <Tile key={i} index={t} width={pondTileWidth(rightOpponent.discards.length)} />
              ))}
            </div>

            {/* 상대 멘츠(치/퐁/깡) */}
            <div style={{ position: 'absolute', left: 390, top: 176, width: 198, display: 'flex', justifyContent: 'flex-end' }}>
              <MeldRow melds={acrossOpponent.melds} width={16} />
            </div>
            <div style={{ position: 'absolute', left: 214, top: 260, display: 'flex', justifyContent: 'flex-end' }}>
              <MeldRow melds={leftOpponent.melds} width={16} />
            </div>
            <div style={{ position: 'absolute', left: 596, top: 260 }}>
              <MeldRow melds={rightOpponent.melds} width={16} />
            </div>

            {/* 상대 손패 뒷면(실제 남은 매수만큼만 표시) */}
            <div style={{ position: 'absolute', left: 295, top: 34, display: 'flex', gap: 2 }}>
              {Array.from({ length: acrossOpponent.hand.reduce((a, b) => a + b, 0) }).map((_, i) => (
                <div key={i} style={{ width: 28, height: 38, borderRadius: 4, background: T.backGradient, border: `1px solid ${T.backBorder}` }} />
              ))}
            </div>
            <div style={{ position: 'absolute', left: 44, top: 132, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Array.from({ length: leftOpponent.hand.reduce((a, b) => a + b, 0) }).map((_, i) => (
                <div key={i} style={{ width: 38, height: 28, borderRadius: 4, background: T.backGradientH, border: `1px solid ${T.backBorder}` }} />
              ))}
            </div>
            <div style={{ position: 'absolute', left: 858, top: 132, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Array.from({ length: rightOpponent.hand.reduce((a, b) => a + b, 0) }).map((_, i) => (
                <div key={i} style={{ width: 38, height: 28, borderRadius: 4, background: T.backGradientHR, border: `1px solid ${T.backBorder}` }} />
              ))}
            </div>

            <div style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: 118, background: T.fadeBottom }} />

            {/* 내 멘츠 */}
            {human.melds.length > 0 && (
              <div style={{ position: 'absolute', left: 14, bottom: 84 }}>
                <MeldRow melds={human.melds} width={22} />
              </div>
            )}

            {/* 내 손패 */}
            <div style={{ position: 'absolute', left: 14, bottom: 20, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <div style={{ display: 'flex', gap: 3 }}>
                {baseHandTiles.map((t, i) => {
                  const clickable = isMyDiscardTurn && !overlayActive;
                  return (
                    <div
                      key={i}
                      role={clickable ? 'button' : undefined}
                      tabIndex={clickable ? 0 : undefined}
                      aria-label={clickable ? `${tileIndexToName(t)} 버릴 패 후보` : undefined}
                      onClick={clickable ? () => handleSelectDiscard(t) : undefined}
                      onKeyDown={
                        clickable
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') handleSelectDiscard(t);
                            }
                          : undefined
                      }
                      style={{
                        cursor: isMyDiscardTurn ? 'pointer' : 'default',
                        transform: selectedDiscard === t ? 'translateY(-8px)' : undefined,
                        transition: 'transform 120ms ease',
                      }}
                    >
                      <Tile index={t} width={40} />
                    </div>
                  );
                })}
              </div>
              {drawnTile !== undefined && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, letterSpacing: '.1em', color: '#e0b463' }}>쯔모</span>
                  <div
                    role={!overlayActive ? 'button' : undefined}
                    tabIndex={!overlayActive ? 0 : undefined}
                    aria-label={`${tileIndexToName(drawnTile)} 방금 뽑은 패`}
                    onClick={!overlayActive ? () => handleSelectDiscard(drawnTile) : undefined}
                    onKeyDown={
                      !overlayActive
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') handleSelectDiscard(drawnTile);
                          }
                        : undefined
                    }
                    style={{
                      cursor: 'pointer',
                      borderRadius: 6,
                      boxShadow: selectedDiscard === drawnTile ? '0 0 0 3px #f39c12' : '0 0 0 2px rgba(224,180,99,.5)',
                      transform: selectedDiscard === drawnTile ? 'translateY(-8px)' : undefined,
                      transition: 'transform 120ms ease',
                    }}
                  >
                    <Tile index={drawnTile} width={40} />
                  </div>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            {isMyDiscardTurn && !overlayActive && (
              <div style={{ position: 'absolute', right: 22, bottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
                {ankanCandidates.map((tile) => (
                  <button
                    key={tile}
                    type="button"
                    onClick={() => handleHumanAnkan(tile)}
                    style={{
                      padding: '12px 22px',
                      borderRadius: 999,
                      background: T.riichiBg,
                      border: `1px solid ${T.riichiBorder}`,
                      color: T.riichiText,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {tileIndexToName(tile)} 안깡
                  </button>
                ))}
                {selectedDiscard !== null && canRiichiOnSelected && (
                  <button
                    type="button"
                    onClick={() => confirmDiscard(true)}
                    style={{
                      padding: '12px 22px',
                      borderRadius: 999,
                      background: T.riichiBg,
                      border: `1px solid ${T.riichiBorder}`,
                      color: T.riichiText,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    리치
                  </button>
                )}
                {selectedDiscard !== null && (
                  <button
                    type="button"
                    onClick={() => confirmDiscard(false)}
                    style={{
                      padding: '14px 26px',
                      borderRadius: 999,
                      background: T.ctaGold,
                      color: T.ctaGoldText,
                      fontSize: 17,
                      fontWeight: 900,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 6px 16px rgba(224,180,99,.35)',
                    }}
                  >
                    {tileIndexToName(selectedDiscard)} 버리기
                  </button>
                )}
                {canTsumo(state) && (
                  <button
                    type="button"
                    onClick={handleHumanTsumo}
                    style={{
                      padding: '14px 26px',
                      borderRadius: 999,
                      background: T.ctaGold,
                      color: T.ctaGoldText,
                      fontSize: 17,
                      fontWeight: 900,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 6px 16px rgba(224,180,99,.35)',
                    }}
                  >
                    쯔모
                  </button>
                )}
              </div>
            )}

            {/* 반응 모달(론/퐁·깡/치) */}
            {overlayActive && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ background: '#1c1613', border: `1px solid ${T.cardBorder}`, color: T.bodyText, borderRadius: 14, padding: 20, minWidth: 280, textAlign: 'center' }}>
                  {pendingReaction?.type === 'ron' && (
                    <>
                      <div style={{ marginBottom: 14, fontSize: 14 }}>
                        {SEAT_LABELS[seatOffset(state.lastDiscard?.seat ?? 0)]}가 버린{' '}
                        {state.lastDiscard ? tileIndexToName(state.lastDiscard.tile) : ''}로 론 할 수 있습니다.
                      </div>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button type="button" onClick={handleHumanRon} style={{ padding: '12px 24px', borderRadius: 999, background: T.ctaGold, color: T.ctaGoldText, fontWeight: 900, border: 'none', cursor: 'pointer' }}>
                          론!
                        </button>
                        <button type="button" onClick={handleSkipReaction} style={{ padding: '12px 20px', borderRadius: 999, background: T.pillBg, border: `1px solid ${T.pillBorder}`, color: T.pillText, cursor: 'pointer' }}>
                          넘기기
                        </button>
                      </div>
                    </>
                  )}
                  {pendingReaction?.type === 'call' && (
                    <>
                      <div style={{ marginBottom: 14, fontSize: 14 }}>
                        {SEAT_LABELS[seatOffset(state.lastDiscard?.seat ?? 0)]}가 버린{' '}
                        {state.lastDiscard ? tileIndexToName(state.lastDiscard.tile) : ''}(으)로 울 수 있습니다.
                      </div>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        {pendingReaction.canKan && (
                          <button type="button" onClick={handleHumanCallKan} style={{ padding: '12px 24px', borderRadius: 999, background: T.riichiBg, border: `1px solid ${T.riichiBorder}`, color: T.riichiText, cursor: 'pointer' }}>
                            깡!
                          </button>
                        )}
                        {pendingReaction.canPon && (
                          <button type="button" onClick={handleHumanCallPon} style={{ padding: '12px 24px', borderRadius: 999, background: T.ctaGold, color: T.ctaGoldText, fontWeight: 900, border: 'none', cursor: 'pointer' }}>
                            퐁!
                          </button>
                        )}
                        <button type="button" onClick={handleSkipReaction} style={{ padding: '12px 20px', borderRadius: 999, background: T.pillBg, border: `1px solid ${T.pillBorder}`, color: T.pillText, cursor: 'pointer' }}>
                          넘기기
                        </button>
                      </div>
                    </>
                  )}
                  {pendingReaction?.type === 'chi' && (
                    <>
                      <div style={{ marginBottom: 14, fontSize: 14 }}>
                        {state.lastDiscard ? tileIndexToName(state.lastDiscard.tile) : ''}(으)로 치를 부를 수 있습니다.
                      </div>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {pendingReaction.options.map((option, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleHumanCallChi(option)}
                            style={{ padding: '12px 18px', borderRadius: 999, background: T.ctaGold, color: T.ctaGoldText, fontWeight: 900, border: 'none', cursor: 'pointer' }}
                          >
                            {tileIndexToName(option[0])}·{tileIndexToName(option[1])}
                          </button>
                        ))}
                        <button type="button" onClick={handleSkipReaction} style={{ padding: '12px 20px', borderRadius: 999, background: T.pillBg, border: `1px solid ${T.pillBorder}`, color: T.pillText, cursor: 'pointer' }}>
                          넘기기
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 우측 보조 패널 */}
          <div style={{ width: 302, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: T.panelBg, borderLeft: `1px solid ${T.panelBorder}`, boxSizing: 'border-box' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={cardHeaderStyle}>역 미리보기</span>
                {assistPreview?.kind === 'score' && (
                  <span style={{ fontSize: 11, color: T.faint2 }}>
                    {assistPreview.isTsumo ? '쯔모' : '론'} {tileIndexToName(assistPreview.waitTile)} 기준
                  </span>
                )}
              </div>
              {!assistPreview && <div style={{ fontSize: 13, color: T.faint2 }}>버릴 패를 선택하면 미리보기가 표시됩니다.</div>}
              {assistPreview?.kind === 'shanten' && (
                <div style={{ fontSize: 14, color: T.bodyText }}>{assistPreview.shanten}샨텐</div>
              )}
              {assistPreview?.kind === 'score' && (
                <>
                  {assistPreview.score.breakdown.map((line, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: T.bodyText }}>{line.name}</span>
                      <span style={{ fontFamily: SERIF, fontWeight: 900, color: T.goldText }}>{line.han}판</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: T.cardBorder }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 13, color: T.muted }}>
                      {assistPreview.score.han}판 {assistPreview.score.fu}부
                    </span>
                    <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 900, color: T.mint }}>
                      {assistPreview.score.totalPoints.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div style={cardStyle}>
              <span style={cardHeaderStyle}>남은 패 카운터</span>
              {[
                { label: '萬子', n: remainingCounts.m, total: 36, color: '#8c3a2f' },
                { label: '筒子', n: remainingCounts.p, total: 36, color: '#2f5f8c' },
                { label: '索子', n: remainingCounts.s, total: 36, color: '#2c6b48' },
                { label: '字牌', n: remainingCounts.z, total: 28, color: '#9a8d78' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 52, fontFamily: SERIF, fontSize: 14, fontWeight: 700, color: row.color }}>{row.label}</span>
                  <div style={{ flex: 1, height: 7, borderRadius: 4, background: '#171310', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: row.color, width: `${Math.round((row.n / row.total) * 100)}%` }} />
                  </div>
                  <span style={{ width: 34, textAlign: 'right', fontFamily: SERIF, fontSize: 14, fontWeight: 900, color: T.bodyText }}>{row.n}</span>
                </div>
              ))}
              {assistPreview?.kind === 'score' && waitRemaining !== null && (
                <div style={{ marginTop: 2, padding: '8px 10px', borderRadius: 9, background: '#1a1512', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: T.muted }}>대기패 {tileIndexToName(assistPreview.waitTile)}</span>
                  <span style={{ fontSize: 13, color: T.mint, fontWeight: 700 }}>잔 {waitRemaining}장</span>
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <span style={cardHeaderStyle}>점수 계산기</span>
              {assistPreview?.kind === 'score' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#cfc4ae' }}>
                    <span>판수·부수</span>
                    <span>
                      {assistPreview.score.han}판 {assistPreview.score.fu}부
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#cfc4ae' }}>
                    <span>지불</span>
                    <span style={{ color: T.goldText, fontWeight: 700 }}>
                      {assistPreview.score.payments.type === 'ron' && assistPreview.score.payments.loserPays.toLocaleString()}
                      {assistPreview.score.payments.type === 'tsumo-dealer' &&
                        `${assistPreview.score.payments.eachNonDealerPays.toLocaleString()} all`}
                      {assistPreview.score.payments.type === 'tsumo-nondealer' &&
                        `${assistPreview.score.payments.dealerPays.toLocaleString()} / ${assistPreview.score.payments.eachOtherNonDealerPays.toLocaleString()}`}
                    </span>
                  </div>
                  {state.riichiSticks > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#cfc4ae' }}>
                      <span>공탁</span>
                      <span>+{(state.riichiSticks * 1000).toLocaleString()}</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 13, color: T.faint2 }}>표시할 정보가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {state.phase === 'ended' && state.result && (
        <ResultPanel state={state} startingScores={startingScores} onRestart={() => setState(null)} />
      )}
    </section>
  );
}

function ResultPanel({
  state,
  startingScores,
  onRestart,
}: {
  state: GameState;
  startingScores: number[];
  onRestart: () => void;
}) {
  const result = state.result;
  if (!result) return null;

  if (result.type === 'draw') {
    return (
      <div style={{ marginTop: 16, padding: 16, borderRadius: 14, background: '#1c1713', border: `1px solid ${T.cardBorder}`, color: T.bodyText, fontFamily: SANS }}>
        <h2 style={{ fontFamily: SERIF, color: T.gold900 }}>유국 (흐름)</h2>
        <div style={{ fontSize: 13, color: T.muted }}>
          {state.riichiSticks > 0 && `리치 공탁금 ${state.riichiSticks * 1000}점은 그대로 남아 있습니다.`}
        </div>
        <div style={{ marginTop: 8 }}>
          {state.players.map((p) => (
            <div key={p.seat}>
              {p.seat === HUMAN_SEAT ? '나' : SEAT_LABELS[seatOffset(p.seat)]}: {p.score.toLocaleString()}점
            </div>
          ))}
        </div>
        <button type="button" onClick={onRestart} style={{ marginTop: 12, padding: '10px 20px', borderRadius: 999, background: T.ctaGold, color: T.ctaGoldText, fontWeight: 900, border: 'none', cursor: 'pointer' }}>
          새 게임 시작
        </button>
      </div>
    );
  }

  const winner = state.players[result.winnerSeat];
  const winTile = result.type === 'tsumo' ? state.lastDraw : state.lastDiscard?.tile;
  const badge = rankBadge(result.score.han, result.score.fu);
  const yakuNames = result.score.yaku.map((y) => y.name).join(', ');
  const comment = `${result.type === 'tsumo' ? '쯔모' : '론'}으로 ${result.score.han}판 ${result.score.fu}부, ${result.score.totalPoints.toLocaleString()}점을 획득했습니다. 성립한 역: ${yakuNames}.`;

  return (
    <div
      style={{
        marginTop: 16,
        padding: '20px 24px',
        borderRadius: 14,
        background: 'radial-gradient(110% 80% at 50% 0%, #2e2419 0%, #14100d 65%)',
        border: `1px solid ${T.cardBorder}`,
        color: T.bodyText,
        fontFamily: SANS,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 900, color: T.gold900 }}>
            {result.type === 'tsumo' ? '쯔모' : '론'}
          </span>
          <span style={{ fontSize: 14, color: T.muted }}>
            {WIND_NAMES[state.roundWind]}１局 · {winner.seat === HUMAN_SEAT ? '나' : SEAT_LABELS[seatOffset(winner.seat)]} ({WIND_NAMES[winner.seatWind]})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: '#c9b68f' }}>
            {result.score.han}판 {result.score.fu}부
          </span>
          {badge && (
            <span style={{ padding: '4px 10px', borderRadius: 999, background: T.ctaGold, color: T.ctaGoldText, fontSize: 13, fontWeight: 900 }}>
              {badge}
            </span>
          )}
        </div>
      </div>

      {winTile !== undefined && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, padding: '14px 16px', marginTop: 14, borderRadius: 12, background: 'linear-gradient(180deg,#1d1814,#161210)', border: `1px solid ${T.cardBorder}` }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {expandHand34(winner.hand)
              .filter((t) => t !== winTile)
              .map((t, i) => (
                <Tile key={i} index={t} width={40} />
              ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, letterSpacing: '.1em', color: '#e0b463' }}>화료패</span>
            <Tile index={winTile} width={40} />
          </div>
          {state.doraIndicators.length > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <span style={{ fontSize: 11, color: T.faint2 }}>도라 표시패</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {state.doraIndicators.map((t, i) => (
                  <Tile key={i} index={t} width={30} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ borderRadius: 14, background: '#1c1713', border: `1px solid ${T.cardBorder}`, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 12, letterSpacing: '.08em', color: T.muted }}>성립한 역</span>
          {result.score.breakdown.map((line, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid #26201a` }}>
              <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: '#efe6d0' }}>{line.name}</span>
              <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 900, color: T.goldText }}>{line.han}판</span>
            </div>
          ))}
          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 6 }}>
            <span style={{ fontSize: 13, color: T.muted }}>획득</span>
            <span style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 900, color: T.mint }}>
              +{result.score.totalPoints.toLocaleString()}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ borderRadius: 14, background: '#1c1713', border: `1px solid ${T.cardBorder}`, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, letterSpacing: '.08em', color: T.muted }}>점수 변동</span>
            {state.players.map((p, i) => {
              const delta = p.score - (startingScores[i] ?? p.score);
              const deltaColor = delta > 0 ? T.mint : delta < 0 ? T.warn : T.muted;
              const deltaText = delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString();
              return (
                <div key={p.seat} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #26201a' }}>
                  <span style={{ width: 28, fontFamily: SERIF, fontSize: 15, fontWeight: 900, color: '#c9b68f' }}>{WIND_NAMES[p.seatWind]}</span>
                  <span style={{ flex: 1, fontSize: 14, color: '#e6dcc7' }}>
                    {p.seat === HUMAN_SEAT ? '나' : SEAT_LABELS[seatOffset(p.seat)]}
                    {p.seat === state.dealerSeat ? ' (친)' : ''}
                  </span>
                  <span style={{ width: 70, textAlign: 'right', fontFamily: SERIF, fontSize: 14, fontWeight: 700, color: deltaColor }}>{deltaText}</span>
                  <span style={{ width: 66, textAlign: 'right', fontFamily: SERIF, fontSize: 15, fontWeight: 900, color: '#f0e6ce' }}>{p.score.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
          <div style={{ borderRadius: 14, background: '#1c1713', border: `1px solid ${T.cardBorder}`, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, letterSpacing: '.08em', color: T.muted }}>결과 코멘트</span>
            <span style={{ fontSize: 13, lineHeight: 1.55, color: '#cfc4ae' }}>{comment}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button type="button" onClick={onRestart} style={{ padding: '12px 26px', borderRadius: 999, background: T.ctaGold, color: T.ctaGoldText, fontSize: 15, fontWeight: 900, border: 'none', cursor: 'pointer' }}>
          새 게임 시작
        </button>
      </div>
    </div>
  );
}
