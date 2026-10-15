import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HandView } from '../components/HandView';
import { AppBrand } from '../components/AppBrand';
import { Body, Card, Heading, Screen } from '../components/ui';
import { INTRO_APP_NAME } from '../branding';
import { YAKU_CATALOG } from './yakuCatalog';
import { useTheme } from '../theme';

export function YakuDictionaryScreen() {
  const theme = useTheme();
  const [selectedKey, setSelectedKey] = useState(YAKU_CATALOG[0].key);
  const selected = YAKU_CATALOG.find((e) => e.key === selectedKey) ?? YAKU_CATALOG[0];

  return (
    <Screen>
      <AppBrand>{INTRO_APP_NAME}</AppBrand>
      <Heading>역 카드 사전</Heading>
      <Body>카드를 눌러보면 조건과 예시 손패를 볼 수 있어요.</Body>

      <View style={styles.grid}>
        {YAKU_CATALOG.map((entry) => {
          const active = entry.key === selectedKey;
          return (
            <Pressable
              key={entry.key}
              onPress={() => setSelectedKey(entry.key)}
              style={[
                styles.cardButton,
                {
                  borderColor: active ? theme.accent : theme.border,
                  borderWidth: active ? 2 : 1,
                  backgroundColor: active ? theme.accentSoft : theme.surface,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: theme.heading }]}>{entry.name}</Text>
              <Text style={[styles.cardSub, { color: theme.textMuted }]}>
                {entry.han}판{entry.menzenOnly ? '·멘젠' : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card>
        <Text style={[styles.detailTitle, { color: theme.heading }]}>{selected.name}</Text>
        <Text style={[styles.body, { color: theme.text }]}>{selected.condition}</Text>
        <HandView key={selected.key} hand={selected.exampleHand} tileWidth={32} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  cardButton: {
    padding: 10,
    borderRadius: 8,
    minWidth: 90,
  },
  cardTitle: { fontWeight: '700' },
  cardSub: { fontSize: 12 },
  detailTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  body: { marginBottom: 8 },
});
