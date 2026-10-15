import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { HandView } from '../components/HandView';
import { AppBrand } from '../components/AppBrand';
import { Body, Button, ButtonRow, Screen } from '../components/ui';
import { NANIKIRU_APP_NAME } from '../branding';
import { tileIndexToName } from '../engine/tileCodec';
import { generateNanikiruProblem } from '../problems/generator';
import type { GradedAnswer, Problem } from '../problems/types';
import { loadOrCreateChapterProgress, recordFixedProblemCleared, recordGeneratedAttempt } from '../progress/store';
import { NANIKIRU_CHAPTERS, CHAPTER_LABELS, CHAPTER_THEORY_TAG, getFixedProblems } from './fixedProblems';
import { addWrongAnswer } from './wrongAnswerQueue';

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
    setProblem(nextMode === 'fixed' ? fixedProblems[fixedIndex % fixedProblems.length] : pickGenerated(chapterId));
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
    <Screen>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <Text style={styles.title}>본훈련</Text>

      <ButtonRow>
        {NANIKIRU_CHAPTERS.map((id) => (
          <Button key={id} title={CHAPTER_LABELS[id] ?? id} onPress={() => switchChapter(id)} disabled={chapterId === id} />
        ))}
      </ButtonRow>

      <ButtonRow>
        <Button title="고정문제은행" onPress={() => switchMode('fixed')} disabled={mode === 'fixed'} />
        <Button title="임의생성" onPress={() => switchMode('generated')} disabled={mode === 'generated'} />
      </ButtonRow>

      <Body>
        {mode === 'fixed'
          ? `진행률: ${progress.fixedPoolCleared}/${progress.fixedPoolTotal}`
          : `임의생성 정답: ${progress.generatedCorrect}/${progress.generatedAttempts}`}
      </Body>

      <Body>버릴 패를 눌러서 등급(S/A/B)과 이유를 확인해보세요.</Body>

      <HandView key={problem.id} hand={problem.hand} interactive onSelectDiscard={handleSelectTile} />

      {selectedAnswer && (
        <>
          <Text style={styles.answerTitle}>
            {tileIndexToName(selectedTile as number)} 버림 — 등급 {selectedAnswer.grade}
          </Text>
          <Text style={styles.answerReason}>{selectedAnswer.reason}</Text>
        </>
      )}

      <Button title="다음 문제" onPress={handleNext} variant="primary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  answerTitle: { fontWeight: '700', marginTop: 12 },
  answerReason: { marginBottom: 12 },
});
