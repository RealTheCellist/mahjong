import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { HandView } from '../components/HandView';
import { AppBrand } from '../components/AppBrand';
import { Body, Button, Heading, Screen, Tab, TabRow } from '../components/ui';
import { NANIKIRU_APP_NAME } from '../branding';
import { tileIndexToName } from '../engine/tileCodec';
import { generateNanikiruProblem } from '../problems/generator';
import type { AnswerGrade, Problem } from '../problems/types';
import { markUnitTestResult } from '../progress/store';
import { NANIKIRU_CHAPTERS, CHAPTER_LABELS, CHAPTER_THEORY_TAG, getFixedProblems } from './fixedProblems';
import { useTheme } from '../theme';

const TOTAL_PROBLEMS = 10;
const PASS_RATIO = 0.7;

function generateProblemSet(chapterId: string): Problem[] {
  return Array.from({ length: TOTAL_PROBLEMS }, () =>
    generateNanikiruProblem({
      chapter: chapterId,
      theoryTag: CHAPTER_THEORY_TAG[chapterId] ?? ['ukeire-efficiency'],
      difficulty: 'basic',
    }),
  );
}

interface UnitTestScreenProps {
  initialChapter?: string;
}

export function UnitTestScreen({ initialChapter }: UnitTestScreenProps = {}) {
  const theme = useTheme();
  const [chapterId, setChapterId] = useState(initialChapter ?? NANIKIRU_CHAPTERS[0]);
  const [problems, setProblems] = useState<Problem[]>(() => generateProblemSet(chapterId));
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

  const switchChapter = (nextChapterId: string) => {
    setChapterId(nextChapterId);
    setProblems(generateProblemSet(nextChapterId));
    setAnswers(Array(TOTAL_PROBLEMS).fill(null));
    setIndex(0);
    setFinished(false);
  };

  const handleNext = () => {
    if (index < TOTAL_PROBLEMS - 1) {
      setIndex((i) => i + 1);
      return;
    }
    const passed = correctCount / TOTAL_PROBLEMS >= PASS_RATIO;
    markUnitTestResult(chapterId, getFixedProblems(chapterId).length, passed);
    setFinished(true);
  };

  const restart = () => {
    setProblems(generateProblemSet(chapterId));
    setAnswers(Array(TOTAL_PROBLEMS).fill(null));
    setIndex(0);
    setFinished(false);
  };

  if (finished) {
    const passed = correctCount / TOTAL_PROBLEMS >= PASS_RATIO;
    return (
      <Screen>
        <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
        <Heading>단원평가 결과 ({CHAPTER_LABELS[chapterId] ?? chapterId})</Heading>
        <Text style={[styles.result, { color: passed ? theme.accent : theme.danger }]}>{passed ? '합격!' : '불합격'}</Text>
        <Body>
          최선(S등급) 선택: {correctCount} / {TOTAL_PROBLEMS} ({Math.round((correctCount / TOTAL_PROBLEMS) * 100)}%)
        </Body>
        <Body>통과 기준: {Math.round(PASS_RATIO * 100)}% 이상</Body>
        <Button title="다시 응시하기" onPress={restart} variant="primary" />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <Heading>단원평가</Heading>

      <TabRow>
        {NANIKIRU_CHAPTERS.map((id) => (
          <Tab key={id} label={CHAPTER_LABELS[id] ?? id} active={chapterId === id} onPress={() => switchChapter(id)} />
        ))}
      </TabRow>

      <Body>
        {index + 1} / {TOTAL_PROBLEMS} 문제 (답변 완료: {answeredCount})
      </Body>
      <Body>버릴 패를 선택하세요.</Body>

      <HandView key={problem.id} hand={problem.hand} interactive onSelectDiscard={handleSelectTile} />

      {selectedAnswer && (
        <Text style={[styles.answer, { color: theme.text }]}>
          {tileIndexToName(selectedAnswer.tile)} 버림 — 등급 {selectedAnswer.grade}
        </Text>
      )}

      <Button
        title={index < TOTAL_PROBLEMS - 1 ? '다음 문제' : '결과 보기'}
        onPress={handleNext}
        disabled={selectedGrade === null}
        variant="primary"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  result: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  answer: { marginVertical: 12 },
});
