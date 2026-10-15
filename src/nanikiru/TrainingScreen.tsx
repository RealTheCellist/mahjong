import { useMemo, useState } from 'react';
import { HandView } from '../components/HandView';
import { tileIndexToName } from '../engine/tileCodec';
import { generateNanikiruProblem } from '../problems/generator';
import type { GradedAnswer, Problem } from '../problems/types';
import {
  loadOrCreateChapterProgress,
  recordFixedProblemCleared,
  recordGeneratedAttempt,
} from '../progress/store';
import { NANIKIRU_CHAPTERS, CHAPTER_LABELS, CHAPTER_THEORY_TAG, getFixedProblems } from './fixedProblems';
import { addWrongAnswer } from './wrongAnswerQueue';
import { AppBrand } from '../components/AppBrand';
import { NANIKIRU_APP_NAME } from '../branding';

type Mode = 'fixed' | 'generated';

function pickGenerated(chapterId: string): Problem {
  return generateNanikiruProblem({
    chapter: chapterId,
    theoryTag: CHAPTER_THEORY_TAG[chapterId] ?? ['ukeire-efficiency'],
    difficulty: 'basic',
  });
}

interface TrainingScreenProps {
  initialChapter?: string;
}

export function TrainingScreen({ initialChapter }: TrainingScreenProps = {}) {
  const [chapterId, setChapterId] = useState(initialChapter ?? NANIKIRU_CHAPTERS[0]);
  const fixedProblems = getFixedProblems(chapterId);
  const [mode, setMode] = useState<Mode>('fixed');
  const [fixedIndex, setFixedIndex] = useState(0);
  const [problem, setProblem] = useState<Problem>(() => fixedProblems[0]);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);

  const progress = loadOrCreateChapterProgress(chapterId, fixedProblems.length);

  const selectedAnswer: GradedAnswer | undefined = useMemo(() => {
    if (selectedTile === null) return undefined;
    return problem.gradedAnswers?.find((a) => a.tile === selectedTile);
  }, [problem, selectedTile]);

  const switchChapter = (nextChapterId: string) => {
    setChapterId(nextChapterId);
    setMode('fixed');
    setFixedIndex(0);
    setSelectedTile(null);
    setProblem(getFixedProblems(nextChapterId)[0]);
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setSelectedTile(null);
    if (nextMode === 'fixed') {
      setProblem(fixedProblems[fixedIndex % fixedProblems.length]);
    } else {
      setProblem(pickGenerated(chapterId));
    }
  };

  const handleSelectTile = (tile: number) => {
    setSelectedTile(tile);
    const answer = problem.gradedAnswers?.find((a) => a.tile === tile);
    if (answer && answer.grade !== 'S') {
      addWrongAnswer({ problem, chosenTile: tile, grade: answer.grade, reason: answer.reason });
    }
  };

  const handleNext = () => {
    if (mode === 'fixed') {
      recordFixedProblemCleared(chapterId, fixedProblems.length);
      const nextIndex = (fixedIndex + 1) % fixedProblems.length;
      setFixedIndex(nextIndex);
      setProblem(fixedProblems[nextIndex]);
    } else {
      recordGeneratedAttempt(chapterId, fixedProblems.length, selectedAnswer?.grade === 'S');
      setProblem(pickGenerated(chapterId));
    }
    setSelectedTile(null);
  };

  return (
    <section style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <h1>나니키루 본훈련</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {NANIKIRU_CHAPTERS.map((id) => (
          <button key={id} type="button" onClick={() => switchChapter(id)} disabled={chapterId === id}>
            {CHAPTER_LABELS[id] ?? id}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={() => switchMode('fixed')} disabled={mode === 'fixed'}>
          고정문제은행
        </button>
        <button type="button" onClick={() => switchMode('generated')} disabled={mode === 'generated'}>
          임의생성
        </button>
      </div>

      <p style={{ color: 'var(--text)' }}>
        {mode === 'fixed'
          ? `진행률: ${progress.fixedPoolCleared}/${progress.fixedPoolTotal}`
          : `임의생성 정답: ${progress.generatedCorrect}/${progress.generatedAttempts}`}
      </p>

      <p>버릴 패를 탭해서 등급(S/A/B)과 이유를 확인해보세요.</p>

      <HandView key={problem.id} hand={problem.hand} interactive onSelectDiscard={handleSelectTile} />

      <div style={{ marginTop: 16, minHeight: 60 }}>
        {selectedAnswer && (
          <div>
            <div style={{ fontWeight: 700 }}>
              {tileIndexToName(selectedTile as number)} 버림 — 등급 {selectedAnswer.grade}
            </div>
            <div>{selectedAnswer.reason}</div>
          </div>
        )}
      </div>

      <button type="button" onClick={handleNext} style={{ marginTop: 8 }}>
        다음 문제
      </button>
    </section>
  );
}
