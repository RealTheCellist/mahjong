import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { HandView } from '../components/HandView';
import { AppBrand } from '../components/AppBrand';
import { Body, Button, Screen } from '../components/ui';
import { INTRO_APP_NAME } from '../branding';
import { checkYaku, type YakuResult } from '../engine/yaku';
import { generateRandomWinningHand } from '../problems/generator';

export function ForwardCheckerScreen() {
  const [round, setRound] = useState(0);
  const { hand, winTile } = useMemo(() => generateRandomWinningHand(), [round]);

  const yakuList: YakuResult[] = useMemo(() => {
    try {
      return checkYaku(hand, { winTile, isTsumo: true });
    } catch {
      return [];
    }
  }, [hand, winTile]);

  return (
    <Screen>
      <AppBrand>{INTRO_APP_NAME}</AppBrand>
      <Text style={styles.title}>정방향 체커</Text>
      <Body>무작위로 완성된 손패에서 어떤 역이 성립하는지 확인해보세요.</Body>

      <HandView key={round} hand={hand} tileWidth={36} />

      {yakuList.length === 0 ? (
        <Text style={styles.dim}>성립하는 역이 없습니다 (역 없이는 화료할 수 없어요).</Text>
      ) : (
        yakuList.map((y) => (
          <Text key={y.key} style={styles.yakuItem}>
            • {y.name}
          </Text>
        ))
      )}

      <Button title="랜덤 손패 생성" onPress={() => setRound((r) => r + 1)} variant="primary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  dim: { color: '#8a8168', marginVertical: 12 },
  yakuItem: { fontSize: 15, marginVertical: 2 },
});
