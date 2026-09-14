import { useMemo, useState } from 'react';
import { HandView } from '../components/HandView';
import { tileIndexToName } from '../engine/tileCodec';
import { generateNanikiruProblem } from '../problems/generator';
import type { AnswerGrade, Problem } from '../problems/types';
import { markUnitTestResult } from '../progress/store';
import { FIXED_PROBLEMS } from './fixedProblems';

const CHAPTER_ID = '2-1';
const TOTAL_PROBLEMS = 10;
const PASS_RATIO = 0.7;

function generateProblemSet(): Problem[] {
  return Array.from({ length: TOTAL_PROBLEMS }, () =>
    generateNanikiruProblem({ chapter: CHAPTER_ID, theoryTag: ['ukeire-efficiency'], difficulty: 'basic' }),
  );
}

export function UnitTestScreen() {
  const [problems, setProblems] = useState<Problem[]>(() => generateProblemSet());
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(AnswerGrade | null)[]>(() => Array(TOTAL_PROBLEMS).fill(null));
  const [finished, setFinished] = useState(false);

  const problem = problems[index];
  const selectedGrade = answers[index];

  const selectedAnswer = useMemo(() => {
    if (selectedGrade === null) return undefined;
    return problem.gradedAnswers?.find((a) => a.grade === selectedGrade);
  }, [problem, selectedGrade]);

  const handleSelectTile = (tile: number) => {
    const answer = problem.gradedAnswers?.find((a) => a.tile === tile);
    if (!answer) return;
    setAnswers((prev) => prev.map((g, i) => (i === index ? answer.grade : g)));
  };

  const correctCount = answers.filter((g) => g === 'S').length;
  const answeredCount = answers.filter((g) => g !== null).length;

  const handleNext = () => {
    if (index < TOTAL_PROBLEMS - 1) {
      setIndex((i) => i + 1);
      return;
    }
    const passed = correctCount / TOTAL_PROBLEMS >= PASS_RATIO;
    markUnitTestResult(CHAPTER_ID, FIXED_PROBLEMS.length, passed);
    setFinished(true);
  };

  const restart = () => {
    setProblems(generateProblemSet());
    setAnswers(Array(TOTAL_PROBLEMS).fill(null));
    setIndex(0);
    setFinished(false);
  };

  if (finished) {
    const passed = correctCount / TOTAL_PROBLEMS >= PASS_RATIO;
    return (
      <section style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
        <h1>단원평가 결과</h1>
        <p style={{ fontSize: 20, fontWeight: 700, color: passed ? '#1e8449' : '#c0392b' }}>
          {passed ? '합격!' : '불합격'}
        </p>
        <p>
          최선(S등급) 선택: {correctCount} / {TOTAL_PROBLEMS} ({Math.round((correctCount / TOTAL_PROBLEMS) * 100)}%)
        </p>
        <p style={{ color: 'var(--text)' }}>통과 기준: {Math.round(PASS_RATIO * 100)}% 이상</p>
        <button type="button" onClick={restart}>
          다시 응시하기
        </button>
      </section>
    );
  }

  return (
    <section style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>단원평가</h1>
      <p style={{ color: 'var(--text)' }}>
        {index + 1} / {TOTAL_PROBLEMS} 문제 (답변 완료: {answeredCount})
      </p>
      <p>버릴 패를 선택하세요.</p>

      <HandView key={problem.id} hand={problem.hand} interactive onSelectDiscard={handleSelectTile} />

      <div style={{ margin: '16px 0', minHeight: 40 }}>
        {selectedAnswer && (
          <div>
            {tileIndexToName(selectedAnswer.tile)} 버림 — 등급 {selectedAnswer.grade}
          </div>
        )}
      </div>

      <button type="button" onClick={handleNext} disabled={selectedGrade === null}>
        {index < TOTAL_PROBLEMS - 1 ? '다음 문제' : '결과 보기'}
      </button>
    </section>
  );
}
