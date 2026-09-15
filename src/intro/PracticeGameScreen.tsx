import { useEffect, useState, type CSSProperties } from 'react';
import { AppBrand } from '../components/AppBrand';
import { HandView } from '../components/HandView';
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
import type { AiLevel, GameState, PlayerState } from '../game/types';
import type { Meld } from '../engine/types';
import { tileIndexToName } from '../engine/tileCodec';
import { findAnkanCandidates } from '../engine/calls';

const HUMAN_SEAT = 0;
const AI_STEP_DELAY_MS = 650;

const SEAT_LABELS = ['나', '오른쪽', '맞은편', '왼쪽'];
const WIND_NAMES: Record<number, string> = { 27: '동', 28: '남', 29: '서', 30: '북' };
const LEVEL_LABELS: Record<AiLevel, string> = { easy: '초급', normal: '중급', hard: '고급' };

// 천봉(天鳳)류의 플랫한 다크 그레이 테이블 배색 — 그림 에셋 없이도 "탁자" 느낌을 주기 위한 단색 팔레트
const FELT_BG = '#2b2b2e';
const FELT_BORDER = '#1a1a1c';
const FELT_TEXT = '#eef0f2';
const ACCENT = '#ffb020';

function seatOffset(seat: number): number {
  return (seat - HUMAN_SEAT + 4) % 4;
}

/** 버림패를 실제 마작 탁자처럼 6장씩 줄바꿈해 늘어놓는다(가와/河) */
function pondRows(discards: number[]): number[][] {
  const rows: number[][] = [];
  for (let i = 0; i < discards.length; i += 6) rows.push(discards.slice(i, i + 6));
  return rows;
}

type PendingReaction =
  | { type: 'ron'; seat: number }
  | { type: 'call'; seat: number; canPon: boolean; canKan: boolean }
  | { type: 'chi'; seat: number; options: [number, number][] };

function MeldView({ meld, width = 20 }: { meld: Meld; width?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {meld.tiles.map((t, i) => (
        <Tile key={i} index={t} width={width} />
      ))}
    </div>
  );
}

function Pond({ discards, tileWidth }: { discards: number[]; tileWidth: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {pondRows(discards).map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 2 }}>
          {row.map((t, j) => (
            <Tile key={j} index={t} width={tileWidth} />
          ))}
        </div>
      ))}
    </div>
  );
}

const opponentBoxStyle = (active: boolean): CSSProperties => ({
  border: active ? `2px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.2)',
  borderRadius: 8,
  padding: '6px 8px',
  background: 'rgba(0,0,0,0.18)',
  color: FELT_TEXT,
  fontSize: 11,
  minWidth: 0,
  width: '100%',
  boxSizing: 'border-box',
});

function OpponentCard({ player, isDealer, active }: { player: PlayerState; isDealer: boolean; active: boolean }) {
  return (
    <div style={opponentBoxStyle(active)}>
      <div style={{ fontWeight: 600, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {isDealer ? '東 ' : ''}
        {SEAT_LABELS[seatOffset(player.seat)]} ({LEVEL_LABELS[player.aiLevel as AiLevel]})
      </div>
      <div style={{ whiteSpace: 'nowrap', marginBottom: 4 }}>
        {player.score}점{player.isRiichi && <span style={{ color: '#ff6b6b' }}> · 리치</span>}
      </div>
      {player.melds.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          {player.melds.map((m, i) => (
            <MeldView key={i} meld={m} width={16} />
          ))}
        </div>
      )}
      <Pond discards={player.discards} tileWidth={14} />
    </div>
  );
}

export function PracticeGameScreen() {
  const [aiLevels, setAiLevels] = useState<[AiLevel, AiLevel, AiLevel]>(['normal', 'normal', 'normal']);
  const [state, setState] = useState<GameState | null>(null);
  const [pendingReaction, setPendingReaction] = useState<PendingReaction | null>(null);
  const [declinedSeats, setDeclinedSeats] = useState<Set<number>>(new Set());
  const [selectedDiscard, setSelectedDiscard] = useState<number | null>(null);

  const startGame = () => {
    setState(dealGame({ humanSeat: HUMAN_SEAT, aiLevels }));
    setPendingReaction(null);
    setDeclinedSeats(new Set());
    setSelectedDiscard(null);
  };

  // 새로운 버림패가 나올 때마다 "이번 버림패에 대해 넘긴 사람" 기록을 초기화한다
  useEffect(() => {
    setDeclinedSeats(new Set());
  }, [state?.lastDiscard]);

  // 자동 진행: AI 차례의 안깡/쯔모/버림 판단, 그리고 버림 이후의 론>퐁·깡>치 순 리액션 처리
  useEffect(() => {
    if (!state || state.phase === 'ended' || pendingReaction) return;

    if (state.phase === 'discard') {
      const player = state.players[state.currentSeat];
      if (player.isHuman) return; // 사람 차례는 UI 조작을 기다린다

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

      // 1순위: 론
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

      // 2순위: 퐁/깡 (치보다 우선)
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

      // 3순위: 치 (버림패 바로 다음 차례만 가능)
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

      // 아무도 부르지 않으면 다음 사람이 드로우
      const timer = setTimeout(() => setState(drawTile(state)), AI_STEP_DELAY_MS - 250);
      return () => clearTimeout(timer);
    }
  }, [state, pendingReaction, declinedSeats]);

  if (!state) {
    return (
      <section style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
        <AppBrand>{INTRO_APP_NAME}</AppBrand>
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
  const rightOpponent = state.players[(HUMAN_SEAT + 1) % 4];
  const acrossOpponent = state.players[(HUMAN_SEAT + 2) % 4];
  const leftOpponent = state.players[(HUMAN_SEAT + 3) % 4];

  const handleSelectDiscard = (tileIndex: number) => {
    setSelectedDiscard(tileIndex);
  };

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
    // 이번 버림패에 한해 이 자리는 더 이상 반응을 묻지 않는다(론/퐁·깡/치 모두)
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

  const overlayActive = pendingReaction !== null;

  return (
    <section style={{ padding: '16px 16px 32px', maxWidth: 720, margin: '0 auto' }}>
      <AppBrand>{INTRO_APP_NAME}</AppBrand>
      <h1>연습 게임</h1>

      <div
        style={{
          position: 'relative',
          background: FELT_BG,
          border: `6px solid ${FELT_BORDER}`,
          borderRadius: 12,
          padding: 12,
          display: 'grid',
          gridTemplateColumns: '1fr 1.3fr 1fr',
          gridTemplateAreas: `"left top right" "left center right" "bottom bottom bottom"`,
          gap: 8,
        }}
      >
        <div style={{ gridArea: 'top', display: 'flex', justifyContent: 'center', minWidth: 0 }}>
          <OpponentCard player={acrossOpponent} isDealer={acrossOpponent.seat === state.dealerSeat} active={state.currentSeat === acrossOpponent.seat} />
        </div>
        <div style={{ gridArea: 'left', display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <OpponentCard player={leftOpponent} isDealer={leftOpponent.seat === state.dealerSeat} active={state.currentSeat === leftOpponent.seat} />
        </div>
        <div style={{ gridArea: 'right', display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <OpponentCard player={rightOpponent} isDealer={rightOpponent.seat === state.dealerSeat} active={state.currentSeat === rightOpponent.seat} />
        </div>

        <div
          style={{
            gridArea: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: FELT_TEXT,
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 8,
            padding: 10,
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15 }}>{WIND_NAMES[state.roundWind]}장</div>
          <div style={{ margin: '4px 0', display: 'flex', gap: 4 }}>
            {state.doraIndicators.map((t, i) => (
              <Tile key={i} index={t} width={24} />
            ))}
          </div>
          <div>산 {state.wall.length}장</div>
          {state.riichiSticks > 0 && <div style={{ color: ACCENT }}>공탁 {state.riichiSticks * 1000}점</div>}
        </div>

        <div
          style={{
            gridArea: 'bottom',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 4,
          }}
        >
          <div style={{ color: FELT_TEXT, fontSize: 12 }}>
            <div style={{ fontWeight: 700 }}>
              나 ({state.currentSeat === HUMAN_SEAT ? '내 차례' : '대기 중'})
              {human.seat === state.dealerSeat ? ' 東' : ''} · {human.score}점
              {human.isRiichi && <span style={{ color: '#ff6b6b' }}> · 리치</span>}
            </div>
            {human.melds.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {human.melds.map((m, i) => (
                  <MeldView key={i} meld={m} width={18} />
                ))}
              </div>
            )}
          </div>
          <Pond discards={human.discards} tileWidth={16} />
        </div>

        {overlayActive && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              style={{
                background: '#1c1c22',
                color: '#fff',
                borderRadius: 10,
                padding: 16,
                minWidth: 240,
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              {pendingReaction?.type === 'ron' && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    {SEAT_LABELS[seatOffset(state.lastDiscard?.seat ?? 0)]}가 버린{' '}
                    {state.lastDiscard ? tileIndexToName(state.lastDiscard.tile) : ''}로 론 할 수 있습니다.
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button type="button" onClick={handleHumanRon}>
                      론!
                    </button>
                    <button type="button" onClick={handleSkipReaction}>
                      넘기기
                    </button>
                  </div>
                </>
              )}
              {pendingReaction?.type === 'call' && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    {SEAT_LABELS[seatOffset(state.lastDiscard?.seat ?? 0)]}가 버린{' '}
                    {state.lastDiscard ? tileIndexToName(state.lastDiscard.tile) : ''}(으)로 울 수 있습니다.
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    {pendingReaction.canKan && (
                      <button type="button" onClick={handleHumanCallKan}>
                        깡!
                      </button>
                    )}
                    {pendingReaction.canPon && (
                      <button type="button" onClick={handleHumanCallPon}>
                        퐁!
                      </button>
                    )}
                    <button type="button" onClick={handleSkipReaction}>
                      넘기기
                    </button>
                  </div>
                </>
              )}
              {pendingReaction?.type === 'chi' && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    {state.lastDiscard ? tileIndexToName(state.lastDiscard.tile) : ''}(으)로 치를 부를 수 있습니다.
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {pendingReaction.options.map((option, i) => (
                      <button key={i} type="button" onClick={() => handleHumanCallChi(option)}>
                        {tileIndexToName(option[0])}·{tileIndexToName(option[1])}로 치
                      </button>
                    ))}
                    <button type="button" onClick={handleSkipReaction}>
                      넘기기
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <HandView
          key={state.turnCount}
          hand={human.hand}
          interactive={state.phase === 'discard' && state.currentSeat === HUMAN_SEAT && pendingReaction === null}
          onSelectDiscard={handleSelectDiscard}
        />

        {state.phase === 'discard' && state.currentSeat === HUMAN_SEAT && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {canTsumo(state) && (
              <button type="button" onClick={handleHumanTsumo}>
                쯔모!
              </button>
            )}
            {ankanCandidates.map((tile) => (
              <button key={tile} type="button" onClick={() => handleHumanAnkan(tile)}>
                {tileIndexToName(tile)} 안깡
              </button>
            ))}
            {selectedDiscard !== null && (
              <>
                <button type="button" onClick={() => confirmDiscard(false)}>
                  {tileIndexToName(selectedDiscard)} 버리기
                </button>
                {canRiichiOnSelected && (
                  <button type="button" onClick={() => confirmDiscard(true)}>
                    리치 선언하고 버리기
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {state.phase === 'ended' && state.result && (
        <div style={{ marginTop: 16, padding: 16, border: '1px solid var(--border)', borderRadius: 8 }}>
          {state.result.type === 'draw' && <h2>유국 (흐름)</h2>}
          {(state.result.type === 'tsumo' || state.result.type === 'ron') && (
            <>
              <h2>
                {state.result.winnerSeat === HUMAN_SEAT ? '나' : SEAT_LABELS[seatOffset(state.result.winnerSeat)]}{' '}
                {state.result.type === 'tsumo' ? '쯔모' : '론'} 승리!
              </h2>
              <div>역: {state.result.score.yaku.map((y) => y.name).join(', ')}</div>
              <div>
                {state.result.score.han}판 {state.result.score.fu}부 · {state.result.score.totalPoints}점
              </div>
            </>
          )}
          <div style={{ marginTop: 8 }}>
            {state.players.map((p) => (
              <div key={p.seat}>
                {p.seat === HUMAN_SEAT ? '나' : SEAT_LABELS[seatOffset(p.seat)]}: {p.score}점
              </div>
            ))}
          </div>
          <button type="button" style={{ marginTop: 12 }} onClick={() => setState(null)}>
            새 게임 시작
          </button>
        </div>
      )}
    </section>
  );
}
