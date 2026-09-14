import { useMemo, useState } from 'react';
import { HandView } from '../components/HandView';
import { tileIndexToName } from '../engine/tileCodec';
import { generateNanikiruProblem } from '../problems/generator';
import type { GradedAnswer, Problem } from '../problems/types';

const CHAPTER_ID = '3-1';

const WIND_LABEL: Record<number, string> = { 27: '동', 28: '남', 29: '서', 30: '북' };

function pickProblem(): Problem {
  return generateNanikiruProblem({
    chapter: CHAPTER_ID,
    theoryTag: ['comprehensive'],
    difficulty: 'realistic',
  });
}

export function ComprehensiveScreen() {
  const [problem, setProblem] = useState<Problem>(() => pickProblem());
  const [selectedTile, setSelectedTile] = useState<number | null>(null);

  const selectedAnswer: GradedAnswer | undefined = useMemo(() => {
    if (selectedTile === null) return undefined;
    return problem.gradedAnswers?.find((a) => a.tile === selectedTile);
  }, [problem, selectedTile]);

  const handleNext = () => {
    setProblem(pickProblem());
    setSelectedTile(null);
  };

  const context = problem.context;

  return (
    <section style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>종합응용</h1>
      <p>순서·도라·자리바람까지 고려한 실전형 문제입니다.</p>

      {context && (
        <ul style={{ color: 'var(--text)', paddingLeft: 20 }}>
          <li>순(巡): {context.turnCount}순</li>
          <li>도라 표시패: {context.doraIndicators.map((t) => tileIndexToName(t)).join(', ')}</li>
          <li>자리바람: {WIND_LABEL[context.seatWind] ?? '-'}</li>
          <li>장풍: {WIND_LABEL[context.roundWind] ?? '-'}</li>
        </ul>
      )}

      <HandView key={problem.id} hand={problem.hand} interactive onSelectDiscard={setSelectedTile} />

      <div style={{ margin: '16px 0', minHeight: 40 }}>
        {selectedAnswer && (
          <div>
            <div style={{ fontWeight: 700 }}>
              {tileIndexToName(selectedAnswer.tile)} 버림 — 등급 {selectedAnswer.grade}
            </div>
            <div>{selectedAnswer.reason}</div>
          </div>
        )}
      </div>

      <button type="button" onClick={handleNext}>
        다음 문제
      </button>
    </section>
  );
}
