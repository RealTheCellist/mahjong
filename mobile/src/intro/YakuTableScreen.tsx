import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppBrand } from '../components/AppBrand';
import { Body, Screen } from '../components/ui';
import { INTRO_APP_NAME } from '../branding';
import { YAKU_CATALOG } from './yakuCatalog';

type SortField = 'name' | 'han' | 'menzen';
type SortDir = 'asc' | 'desc';

export function YakuTableScreen() {
  const [filterText, setFilterText] = useState('');
  const [sortField, setSortField] = useState<SortField>('han');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (field: SortField) => {
    if (field === sortField) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const rows = useMemo(() => {
    const filtered = YAKU_CATALOG.filter((e) => e.name.includes(filterText));
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name, 'ko');
      else if (sortField === 'han') cmp = a.han - b.han;
      else cmp = Number(a.menzenOnly) - Number(b.menzenOnly);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filterText, sortField, sortDir]);

  const arrow = (field: SortField) => (field === sortField ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');

  return (
    <Screen>
      <AppBrand>{INTRO_APP_NAME}</AppBrand>
      <Text style={styles.title}>조건 비교 테이블</Text>
      <Body>역 이름으로 검색하거나, 열 제목을 눌러 정렬해보세요.</Body>

      <TextInput
        placeholder="역 이름 검색..."
        value={filterText}
        onChangeText={setFilterText}
        style={styles.input}
      />

      <View style={styles.row}>
        <Pressable style={[styles.headerCell, { flex: 1.4 }]} onPress={() => toggleSort('name')}>
          <Text style={styles.headerText}>역{arrow('name')}</Text>
        </Pressable>
        <Pressable style={styles.headerCell} onPress={() => toggleSort('han')}>
          <Text style={styles.headerText}>판수{arrow('han')}</Text>
        </Pressable>
        <Pressable style={styles.headerCell} onPress={() => toggleSort('menzen')}>
          <Text style={styles.headerText}>멘젠{arrow('menzen')}</Text>
        </Pressable>
      </View>

      {rows.map((entry) => (
        <View key={entry.key} style={styles.dataRow}>
          <View style={styles.row}>
            <Text style={[styles.cell, { flex: 1.4, fontWeight: '700' }]}>{entry.name}</Text>
            <Text style={styles.cell}>{entry.han}판</Text>
            <Text style={styles.cell}>{entry.menzenOnly ? '예' : '아니오'}</Text>
          </View>
          <Text style={styles.condition}>{entry.condition}</Text>
        </View>
      ))}
      {rows.length === 0 && <Text style={styles.dim}>검색 결과가 없습니다.</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e0dac6',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  row: { flexDirection: 'row' },
  headerCell: { flex: 1, backgroundColor: '#f4f3ec', padding: 8 },
  headerText: { fontWeight: '700', textAlign: 'center' },
  dataRow: { borderBottomWidth: 1, borderBottomColor: '#e0dac6', paddingVertical: 8 },
  cell: { flex: 1, textAlign: 'center' },
  condition: { fontSize: 13, color: '#555', marginTop: 4 },
  dim: { color: '#8a8168', marginTop: 12 },
});
