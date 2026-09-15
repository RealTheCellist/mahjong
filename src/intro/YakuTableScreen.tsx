import { useMemo, useState, type CSSProperties } from 'react';
import { YAKU_CATALOG } from './yakuCatalog';
import { AppBrand } from '../components/AppBrand';
import { INTRO_APP_NAME } from '../branding';

type SortField = 'name' | 'han' | 'menzen';
type SortDir = 'asc' | 'desc';

export function YakuTableScreen() {
  const [filterText, setFilterText] = useState('');
  const [sortField, setSortField] = useState<SortField>('han');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const rows = useMemo(() => {
    const filtered = YAKU_CATALOG.filter((e) => e.name.includes(filterText));
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name, 'ko');
      else if (sortField === 'han') cmp = a.han - b.han;
      else cmp = Number(a.menzenOnly) - Number(b.menzenOnly);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filterText, sortField, sortDir]);

  const headerStyle = (field: SortField): CSSProperties => ({
    ...cellStyle,
    cursor: 'pointer',
    userSelect: 'none',
    fontWeight: 700,
    background: field === sortField ? 'var(--code-bg, #f4f3ec)' : undefined,
  });

  const arrow = (field: SortField) => (field === sortField ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');

  return (
    <section style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <AppBrand>{INTRO_APP_NAME}</AppBrand>
      <h1>조건 비교 테이블</h1>
      <p>역 이름으로 검색하거나, 열 제목을 눌러 정렬해보세요.</p>

      <input
        type="text"
        placeholder="역 이름 검색..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        style={{ marginBottom: 12, padding: 6, width: '100%', boxSizing: 'border-box' }}
      />

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={headerStyle('name')} onClick={() => toggleSort('name')}>
              역{arrow('name')}
            </th>
            <th style={headerStyle('han')} onClick={() => toggleSort('han')}>
              판수{arrow('han')}
            </th>
            <th style={headerStyle('menzen')} onClick={() => toggleSort('menzen')}>
              멘젠 전용{arrow('menzen')}
            </th>
            <th style={cellStyle}>조건</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => (
            <tr key={entry.key}>
              <td style={cellStyle}>{entry.name}</td>
              <td style={cellStyle}>{entry.han}판</td>
              <td style={cellStyle}>{entry.menzenOnly ? '예' : '아니오'}</td>
              <td style={{ ...cellStyle, textAlign: 'left' }}>{entry.condition}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td style={cellStyle} colSpan={4}>
                검색 결과가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

const cellStyle: CSSProperties = {
  border: '1px solid var(--border)',
  padding: '6px 10px',
  textAlign: 'center',
};
