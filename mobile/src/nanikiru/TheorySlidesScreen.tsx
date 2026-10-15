import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppBrand } from '../components/AppBrand';
import { Body, Button, ButtonRow, Card, Dropdown, Heading, Screen } from '../components/ui';
import { NANIKIRU_APP_NAME } from '../branding';
import { getTheorySlides } from './theorySlides';
import { NANIKIRU_CHAPTERS, CHAPTER_LABELS } from './fixedProblems';
import { useTheme } from '../theme';

const CHAPTER_OPTIONS = NANIKIRU_CHAPTERS.map((id) => ({ value: id, label: CHAPTER_LABELS[id] ?? id }));

export function TheorySlidesScreen() {
  const theme = useTheme();
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
      <Heading>이론학습</Heading>

      <Dropdown value={chapterId} options={CHAPTER_OPTIONS} onChange={switchChapter} placeholder="챕터 선택..." />

      <Body>
        {index + 1} / {slides.length}
      </Body>
      <Card>
        <Text style={[styles.slideTitle, { color: theme.heading }]}>{slide.title}</Text>
        <Text style={[styles.slideBody, { color: theme.text }]}>{slide.body}</Text>
      </Card>
      <ButtonRow>
        <Button title="이전" onPress={() => setIndex((i) => i - 1)} disabled={isFirst} />
        <Button title="다음" onPress={() => setIndex((i) => i + 1)} disabled={isLast} />
      </ButtonRow>
    </Screen>
  );
}

const styles = StyleSheet.create({
  slideTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  slideBody: { lineHeight: 22 },
});
