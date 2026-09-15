import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HandView } from './src/components/HandView';
import { tileIndexToName } from './src/engine/tileCodec';
import { generateNanikiruProblem } from './src/problems/generator';
import type { GradedAnswer, Problem } from './src/problems/types';

function pickProblem(): Problem {
  return generateNanikiruProblem({
    chapter: '2-1',
    theoryTag: ['ukeire-efficiency'],
    difficulty: 'basic',
  });
}

export default function App() {
  const [problem, setProblem] = useState<Problem>(() => pickProblem());
  const [selectedTile, setSelectedTile] = useState<number | null>(null);

  const selectedAnswer: GradedAnswer | undefined =
    selectedTile === null ? undefined : problem.gradedAnswers?.find((a) => a.tile === selectedTile);

  const handleNext = () => {
    setProblem(pickProblem());
    setSelectedTile(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>나니키루 연구소</Text>
        <Text style={styles.title}>본훈련 (모바일 검증)</Text>
        <Text style={styles.body}>버릴 패를 눌러서 등급(S/A/B)을 확인해보세요.</Text>

        <HandView key={problem.id} hand={problem.hand} interactive onSelectDiscard={setSelectedTile} />

        <View style={styles.answerBox}>
          {selectedAnswer && (
            <>
              <Text style={styles.answerTitle}>
                {tileIndexToName(selectedAnswer.tile)} 버림 — 등급 {selectedAnswer.grade}
              </Text>
              <Text>{selectedAnswer.reason}</Text>
            </>
          )}
        </View>

        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>다음 문제</Text>
        </Pressable>
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  brand: { fontSize: 12, color: '#8a8168', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  body: { marginBottom: 12 },
  answerBox: { minHeight: 50, marginVertical: 12 },
  answerTitle: { fontWeight: '700', marginBottom: 4 },
  button: { backgroundColor: '#2471a3', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
