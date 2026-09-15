import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HandView } from '../components/HandView';
import { AppBrand } from '../components/AppBrand';
import { Body, Card, Screen } from '../components/ui';
import { INTRO_APP_NAME } from '../branding';
import { YAKU_CATALOG } from './yakuCatalog';

export function YakuDictionaryScreen() {
  const [selectedKey, setSelectedKey] = useState(YAKU_CATALOG[0].key);
  const selected = YAKU_CATALOG.find((e) => e.key === selectedKey) ?? YAKU_CATALOG[0];

  return (
    <Screen>
      <AppBrand>{INTRO_APP_NAME}</AppBrand>
      <Text style={styles.title}>역 카드 사전</Text>
      <Body>카드를 눌러보면 조건과 예시 손패를 볼 수 있어요.</Body>

      <View style={styles.grid}>
        {YAKU_CATALOG.map((entry) => (
          <Pressable
            key={entry.key}
            onPress={() => setSelectedKey(entry.key)}
            style={[styles.cardButton, entry.key === selectedKey && styles.cardButtonActive]}
          >
            <Text style={styles.cardTitle}>{entry.name}</Text>
            <Text style={styles.cardSub}>
              {entry.han}판{entry.menzenOnly ? '·멘젠' : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      <Card>
        <Text style={styles.detailTitle}>{selected.name}</Text>
        <Text style={styles.body}>{selected.condition}</Text>
        <HandView key={selected.key} hand={selected.exampleHand} tileWidth={32} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  cardButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0dac6',
    minWidth: 90,
  },
  cardButtonActive: { borderColor: '#f39c12', borderWidth: 2, backgroundColor: '#f4f3ec' },
  cardTitle: { fontWeight: '700' },
  cardSub: { fontSize: 12, color: '#8a8168' },
  detailTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  body: { marginBottom: 8 },
});
