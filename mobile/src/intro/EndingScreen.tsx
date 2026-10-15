import { StyleSheet, Text } from 'react-native';
import { AppBrand } from '../components/AppBrand';
import { Button, Screen } from '../components/ui';
import { INTRO_APP_NAME, NANIKIRU_APP_NAME } from '../branding';
import { useTheme } from '../theme';

interface EndingScreenProps {
  onGoToNanikiru: () => void;
}

export function EndingScreen({ onGoToNanikiru }: EndingScreenProps) {
  const theme = useTheme();
  return (
    <Screen>
      <AppBrand>{INTRO_APP_NAME}</AppBrand>
      <Text style={[styles.title, { color: theme.heading }]}>입문 미션 완주!</Text>
      <Text style={[styles.body, { color: theme.text }]}>
        패 종류 구분과 순쯔 만들기를 모두 익혔습니다.{'\n'}
        이제 배운 규칙을 바탕으로 실력을 훈련하는 {NANIKIRU_APP_NAME}로 넘어가볼까요?
      </Text>
      <Button title="나니키루 시작하기 →" onPress={onGoToNanikiru} variant="primary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  body: { textAlign: 'center', marginBottom: 20, lineHeight: 20 },
});
