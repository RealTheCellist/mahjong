import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppBrand } from '../components/AppBrand';
import { Body, Button, ButtonRow, Card, Screen } from '../components/ui';
import { NANIKIRU_APP_NAME } from '../branding';
import { THEORY_SLIDES } from './theorySlides';

export function TheorySlidesScreen() {
  const [index, setIndex] = useState(0);
  const slide = THEORY_SLIDES[index];
  const isFirst = index === 0;
  const isLast = index === THEORY_SLIDES.length - 1;

  return (
    <Screen>
      <AppBrand>{NANIKIRU_APP_NAME}</AppBrand>
      <Text style={styles.title}>이론학습</Text>
      <Body>
        {index + 1} / {THEORY_SLIDES.length}
      </Body>

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
