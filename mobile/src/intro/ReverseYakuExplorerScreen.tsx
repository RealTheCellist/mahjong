import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Tile } from '../components/Tile';
import { AppBrand } from '../components/AppBrand';
import { Body, Screen } from '../components/ui';
import { INTRO_APP_NAME } from '../branding';
import { expandHand34 } from '../ui/tileDisplay';
import { tileNameToIndex } from '../engine/tileCodec';
import { YAKU_CATALOG } from './yakuCatalog';

export function ReverseYakuExplorerScreen() {
  const [selectedKey, setSelectedKey] = useState(YAKU_CATALOG[0].key);
  const entry = YAKU_CATALOG.find((e) => e.key === selectedKey) ?? YAKU_CATALOG[0];

  const tiles = useMemo(() => expandHand34(entry.exampleHand), [entry]);

  const highlightPositions = useMemo(() => {
    const remaining = [...entry.highlightTiles];
    const positions = new Set<number>();
    tiles.forEach((tileIndex, position) => {
      const idx = remaining.findIndex((n) => tileNameToIndex(n) === tileIndex);
      if (idx !== -1) {
        positions.add(position);
        remaining.splice(idx, 1);
      }
    });
    return positions;
  }, [tiles, entry]);

  return (
    <Screen>
      <AppBrand>{INTRO_APP_NAME}</AppBrand>
      <Text style={styles.title}>역방향 탐색기</Text>
      <Body>역을 선택하면 조건을 만족시키는 핵심 패가 강조 표시됩니다.</Body>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {YAKU_CATALOG.map((e) => (
          <Pressable
            key={e.key}
            onPress={() => setSelectedKey(e.key)}
            style={[styles.chip, e.key === selectedKey && styles.chipActive]}
          >
            <Text style={e.key === selectedKey ? styles.chipTextActive : styles.chipText}>{e.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.condition}>{entry.condition}</Text>

      <View style={styles.grid}>
        {tiles.map((tileIndex, position) => (
          <Tile key={position} index={tileIndex} width={38} selected={highlightPositions.has(position)} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  chipRow: { marginBottom: 12 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0dac6',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#2471a3', borderColor: '#2471a3' },
  chipText: { color: '#4a4530' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  condition: { marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
});
