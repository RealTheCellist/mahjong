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
import { FIXED_PROBLEMS } from './fixedProblems';
import { addWrongAnswer } from './wrongAnswerQueue';

const CHAPTER_ID = '2-1';

type Mode = 'fixed' | 'generated';

function pickGenerated(): Problem {
  return generateNanikiruProblem({ chapter: CHAPTER_ID, theoryTag: ['ukeire-efficiency'], difficulty: 'basic' });
}

export function TrainingScreen() {
  const [mode, setMode] = useState<Mode>('fixed');
  const [fixedIndex, setFixedIndex] = useState(0);
  const [problem, setProblem] = useState<Problem>(() => FIXED_PROBLEMS[0]);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);

  const progress = loadOrCreateChapterProgress(CHAPTER_ID, FIXED_PROBLEMS.length);

  const selectedAnswer: GradedAnswer | undefined = useMemo(() => {
    if (selectedTile === null) return undefined;
    return problem.gradedAnswers?.find((a) => a.tile === selectedTile);
  }, [problem, selectedTile]);

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setSelectedTile(null);
    setProblem(nextMode === 'fixed' ? FIXED_PROBLEMS[fixedIndex % FIXED_PROBLEMS.length] : pickGenerated());
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
      recordFixedProblemCleared(CHAPTER_ID, FIXED_PROBLEMS.length);
      const nextIndex = (fixedIndex + 1) % FIXED_PROBLEMS.length;
      setFixedIndex(nextIndex);
      setProblem(FIXED_PROBLEMS[nextIndex]);
    } else {
      recordGeneratedAttempt(CHAPTER_ID, FIXED_PROBLEMS.length, selectedAnswer?.grade === 'S');
      setProblem(pickGenerated());
    }
    setSelectedTile(null);
  };

  return (
    <Screen>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <Text style={styles.title}>본훈련</Text>

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
