import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppBrand } from '../components/AppBrand';
import { Body, Button, ButtonRow, Card, Screen } from '../components/ui';
import { NANIKIRU_APP_NAME } from '../branding';
import { getTheorySlides } from './theorySlides';
import { NANIKIRU_CHAPTERS, CHAPTER_LABELS } from './fixedProblems';

export function TheorySlidesScreen() {
  const [chapterId, setChapterId] = useState<string>(NANIKIRU_CHAPTERS[0]);
  const [index, setIndex] = useState(0);

  const slides = getTheorySlides(chapterId);
  const slide = slides[index];
  const isFirst = index === 0;
  const isLast = index === slides.length - 1;

  const switchChapter = (nextChapterId: string) => {
    setChapterId(nextChapterId);
    setIndex(0);
  };

  return (
    <Screen>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <Text style={styles.title}>이론학습</Text>

      <ButtonRow>
        {NANIKIRU_CHAPTERS.map((id) => (
          <Button key={id} title={CHAPTER_LABELS[id] ?? id} onPress={() => switchChapter(id)} disabled={chapterId === id} />
        ))}
      </ButtonRow>

      <Body>{index + 1} / {slides.length}</Body>
      <Card>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideBody}>{slide.body}</Text>
      </Card>
      <ButtonRow>
        <Button title="이전" onPress={() => setIndex((i) => i - 1)} disabled={isFirst} />
        <Button title="다음" onPress={() => setIndex((i) => i + 1)} disabled={isLast} />
      </ButtonRow>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  slideTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  slideBody: { lineHeight: 22 },
});
