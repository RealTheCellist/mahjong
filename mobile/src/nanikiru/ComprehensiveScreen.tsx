import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { HandView } from '../components/HandView';
import { AppBrand } from '../components/AppBrand';
import { Body, Button, Screen } from '../components/ui';
import { NANIKIRU_APP_NAME } from '../branding';
import { tileIndexToName } from '../engine/tileCodec';
import { generateNanikiruProblem } from '../problems/generator';
import type { GradedAnswer, Problem } from '../problems/types';
import { NANIKIRU_CHAPTERS, CHAPTER_LABELS, CHAPTER_THEORY_TAG } from './fixedProblems';
import { getAccessibleChapters } from '../progress/store';

const WIND_LABEL: Record<number, string> = { 27: '동', 28: '남', 29: '서', 30: '북' };

function pickRandomChapter(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickProblem(chapterId: string): Problem {
  return generateNanikiruProblem({
    chapter: chapterId,
    theoryTag: CHAPTER_THEORY_TAG[chapterId] ?? ['comprehensive'],
    difficulty: 'realistic',
  });
}

export function ComprehensiveScreen() {
  const accessibleChapters = useMemo(() => getAccessibleChapters([...NANIKIRU_CHAPTERS]), []);
  const [problem, setProblem] = useState<Problem>(() => pickProblem(pickRandomChapter(accessibleChapters)));
  const [selectedTile, setSelectedTile] = useState<number | null>(null);

  const selectedAnswer: GradedAnswer | undefined = useMemo(() => {
    if (selectedTile === null) return undefined;
    return problem.gradedAnswers?.find((a) => a.tile === selectedTile);
  }, [problem, selectedTile]);

  const handleNext = () => {
    setProblem(pickProblem(pickRandomChapter(accessibleChapters)));
    setSelectedTile(null);
  };

  const context = problem.context;

  return (
    <Screen>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <Text style={styles.title}>종합응용</Text>
      <Body>
        지금까지 배운 챕터({accessibleChapters.map((id) => CHAPTER_LABELS[id] ?? id).join(', ')})를 섞어서 출제하는 실전형
        문제입니다.
      </Body>

      <Text style={styles.chapterBadge}>이번 문제: {CHAPTER_LABELS[problem.chapter] ?? problem.chapter} 유형</Text>

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
  chapterBadge: { fontWeight: '700', marginBottom: 8 },
  answerTitle: { fontWeight: '700', marginTop: 12 },
  answerReason: { marginBottom: 12 },
});
