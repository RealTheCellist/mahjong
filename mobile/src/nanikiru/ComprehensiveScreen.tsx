import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { HandView } from '../components/HandView';
import { AppBrand } from '../components/AppBrand';
import { Body, Button, ButtonRow, Screen } from '../components/ui';
import { NANIKIRU_APP_NAME } from '../branding';
import { tileIndexToName } from '../engine/tileCodec';
import { generateNanikiruProblem } from '../problems/generator';
import type { GradedAnswer, Problem } from '../problems/types';
import { NANIKIRU_CHAPTERS, CHAPTER_LABELS, CHAPTER_THEORY_TAG } from './fixedProblems';

const WIND_LABEL: Record<number, string> = { 27: '동', 28: '남', 29: '서', 30: '북' };

function pickProblem(chapterId: string): Problem {
  return generateNanikiruProblem({
    chapter: chapterId,
    theoryTag: CHAPTER_THEORY_TAG[chapterId] ?? ['comprehensive'],
    difficulty: 'realistic',
  });
}

export function ComprehensiveScreen() {
  const [chapterId, setChapterId] = useState<string>(NANIKIRU_CHAPTERS[0]);
  const [problem, setProblem] = useState<Problem>(() => pickProblem(NANIKIRU_CHAPTERS[0]));
  const [selectedTile, setSelectedTile] = useState<number | null>(null);

  const selectedAnswer: GradedAnswer | undefined = useMemo(() => {
    if (selectedTile === null) return undefined;
    return problem.gradedAnswers?.find((a) => a.tile === selectedTile);
  }, [problem, selectedTile]);

  const switchChapter = (nextChapterId: string) => {
    setChapterId(nextChapterId);
    setProblem(pickProblem(nextChapterId));
    setSelectedTile(null);
  };

  const handleNext = () => {
    setProblem(pickProblem(chapterId));
    setSelectedTile(null);
  };

  const context = problem.context;

  return (
    <Screen>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <Text style={styles.title}>종합응용</Text>
      <Body>순서·도라·자리바람까지 고려한 실전형 문제입니다.</Body>

      <ButtonRow>
        {NANIKIRU_CHAPTERS.map((id) => (
          <Button key={id} title={CHAPTER_LABELS[id] ?? id} onPress={() => switchChapter(id)} disabled={chapterId === id} />
        ))}
      </ButtonRow>

      {context && (
        <>
          <Text>순(巡): {context.turnCount}순</Text>
          <Text>도라 표시패: {context.doraIndicators.map((t) => tileIndexToName(t)).join(', ')}</Text>
          <Text>자리바람: {WIND_LABEL[context.seatWind] ?? '-'}</Text>
          <Text style={{ marginBottom: 12 }}>장풍: {WIND_LABEL[context.roundWind] ?? '-'}</Text>
        </>
      )}

      <HandView key={problem.id} hand={problem.hand} interactive onSelectDiscard={setSelectedTile} />

      {selectedAnswer && (
        <>
          <Text style={styles.answerTitle}>
            {tileIndexToName(selectedAnswer.tile)} 버림 — 등급 {selectedAnswer.grade}
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
