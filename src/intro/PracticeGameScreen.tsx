import { useEffect, useState } from 'react';
import { AppBrand } from '../components/AppBrand';
import { HandView } from '../components/HandView';
import { Tile } from '../components/Tile';
import { INTRO_APP_NAME } from '../branding';
import { dealGame, drawTile, discardTile, canTsumo, canRon, applyTsumo, applyRon, isTenpaiAfterDiscard } from '../game/gameEngine';
import { decideAiDiscard, decideAiTsumo, decideAiRon } from '../game/aiPlayer';
import type { AiLevel, GameState } from '../game/types';
import { tileIndexToName } from '../engine/tileCodec';

const HUMAN_SEAT = 0;
const AI_STEP_DELAY_MS = 650;

const SEAT_LABELS = ['나', '오른쪽', '맞은편', '왼쪽'];
const WIND_NAMES: Record<number, string> = { 27: '동', 28: '남', 29: '서', 30: '북' };
const LEVEL_LABELS: Record<AiLevel, string> = { easy: '초급', normal: '중급', hard: '고급' };

function seatOffset(seat: number): number {
  return (seat - HUMAN_SEAT + 4) % 4;
}

export function PracticeGameScreen() {
  const [aiLevels, setAiLevels] = useState<[AiLevel, AiLevel, AiLevel]>(['normal', 'normal', 'normal']);
  const [state, setState] = useState<GameState | null>(null);
  const [pendingRonSeat, setPendingRonSeat] = useState<number | null>(null);
  const [selectedDiscard, setSelectedDiscard] = useState<number | null>(null);

  const startGame = () => {
    setState(dealGame({ humanSeat: HUMAN_SEAT, aiLevels }));
    setPendingRonSeat(null);
    setSelectedDiscard(null);
  };

  // 자동 진행: AI 차례의 쯔모/버림 판단, 그리고 버림 이후의 론 리액션 윈도우 처리
  useEffect(() => {
    if (!state || state.phase === 'ended' || pendingRonSeat !== null) return;

    if (state.phase === 'discard') {
      const player = state.players[state.currentSeat];
      if (player.isHuman) return; // 사람 차례는 UI 조작을 기다린다

      const timer = setTimeout(() => {
        if (canTsumo(state) && decideAiTsumo()) {
          setState(applyTsumo(state));
          return;
        }
        const { tile, declareRiichi } = decideAiDiscard(state, state.currentSeat);
        setState(discardTile(state, tile, { declareRiichi }));
      }, AI_STEP_DELAY_MS);
      return () => clearTimeout(timer);
    }

    if (state.phase === 'draw') {
      // 방금 버려진 패에 대해 론 가능한 사람이 있는지, 버림 다음 자리부터 순서대로 확인한다
      const order = [0, 1, 2].map((o) => (state.currentSeat + o) % 4);
      for (const seat of order) {
        if (!canRon(state, seat)) continue;
        const reactor = state.players[seat];
        if (reactor.isHuman) {
          setPendingRonSeat(seat);
          return;
        }
        if (decideAiRon()) {
          const timer = setTimeout(() => setState(applyRon(state, seat)), AI_STEP_DELAY_MS);
          return () => clearTimeout(timer);
        }
      }
      const timer = setTimeout(() => setState(drawTile(state)), AI_STEP_DELAY_MS - 250);
      return () => clearTimeout(timer);
    }
  }, [state, pendingRonSeat]);

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

  const handleSelectDiscard = (tileIndex: number) => {
    setSelectedDiscard(tileIndex);
  };

  const confirmDiscard = (declareRiichi: boolean) => {
    if (selectedDiscard === null) return;
    setState(discardTile(state, selectedDiscard, { declareRiichi }));
    setSelectedDiscard(null);
  };

  const handleHumanTsumo = () => setState(applyTsumo(state));

  const handleHumanRon = () => {
    if (pendingRonSeat === null) return;
    setState(applyRon(state, pendingRonSeat));
    setPendingRonSeat(null);
  };

  const handleSkipRon = () => {
    if (!state) return;
    setPendingRonSeat(null);
    setState(drawTile(state));
  };

  const canRiichiOnSelected =
    selectedDiscard !== null &&
    !human.isRiichi &&
    human.score >= 1000 &&
    isTenpaiAfterDiscard(human.hand, selectedDiscard);

  return (
    <section style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <AppBrand>{INTRO_APP_NAME}</AppBrand>
      <h1>연습 게임</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          {WIND_NAMES[state.roundWind]}장 · 남은 패 {state.wall.length}장
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          도라 표시:
          {state.doraIndicators.map((t, i) => (
            <Tile key={i} index={t} width={32} />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        {state.players
          .filter((p) => p.seat !== HUMAN_SEAT)
          .map((p) => (
            <div
              key={p.seat}
              style={{
                border: state.currentSeat === p.seat ? '2px solid #f39c12' : '1px solid var(--border)',
                borderRadius: 8,
                padding: 8,
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 600 }}>
                {SEAT_LABELS[seatOffset(p.seat)]} ({LEVEL_LABELS[p.aiLevel as AiLevel]})
                {p.seat === state.dealerSeat ? ' · 딜러' : ''}
              </div>
              <div>점수: {p.score}</div>
              <div>{p.isRiichi ? '리치 중' : ''}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 4 }}>
                {p.discards.map((t, i) => (
                  <Tile key={i} index={t} width={18} />
                ))}
              </div>
            </div>
          ))}
      </div>

      <div style={{ marginBottom: 8 }}>
        내 점수: {human.score} {human.isRiichi ? '· 리치 중' : ''}
        {human.seat === state.dealerSeat ? ' · 딜러' : ''}
        {' · 현재 차례: '}
        {state.currentSeat === HUMAN_SEAT ? '나' : SEAT_LABELS[seatOffset(state.currentSeat)]}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 8 }}>
        내 버림패:
        {human.discards.map((t, i) => (
          <Tile key={i} index={t} width={22} />
        ))}
      </div>

      <HandView
        key={state.turnCount}
        hand={human.hand}
        interactive={state.phase === 'discard' && state.currentSeat === HUMAN_SEAT && pendingRonSeat === null}
        onSelectDiscard={handleSelectDiscard}
      />

      {state.phase === 'discard' && state.currentSeat === HUMAN_SEAT && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {canTsumo(state) && (
            <button type="button" onClick={handleHumanTsumo}>
              쯔모!
            </button>
          )}
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

      {pendingRonSeat !== null && (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
          <div>
            {SEAT_LABELS[seatOffset(state.lastDiscard?.seat ?? 0)]}가 버린{' '}
            {state.lastDiscard ? tileIndexToName(state.lastDiscard.tile) : ''}로 론 할 수 있습니다.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" onClick={handleHumanRon}>
              론!
            </button>
            <button type="button" onClick={handleSkipRon}>
              넘기기
            </button>
          </div>
        </div>
      )}

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
