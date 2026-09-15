import { useState } from 'react';
import { HandView } from '../components/HandView';
import { YAKU_CATALOG } from './yakuCatalog';
import { AppBrand } from '../components/AppBrand';
import { INTRO_APP_NAME } from '../branding';

export function YakuDictionaryScreen() {
  const [selectedKey, setSelectedKey] = useState(YAKU_CATALOG[0].key);
  const selected = YAKU_CATALOG.find((e) => e.key === selectedKey) ?? YAKU_CATALOG[0];

  return (
    <section style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <AppBrand>{INTRO_APP_NAME}</AppBrand>
      <h1>역 카드 사전</h1>
      <p>카드를 탭하면 조건과 예시 손패를 볼 수 있어요.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
        {YAKU_CATALOG.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setSelectedKey(entry.key)}
            style={{
              padding: '10px 6px',
              borderRadius: 8,
              border: entry.key === selectedKey ? '2px solid #f39c12' : '1px solid var(--border)',
              background: entry.key === selectedKey ? 'var(--code-bg, #f4f3ec)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 700 }}>{entry.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text)' }}>{entry.han}판{entry.menzenOnly ? '·멘젠' : ''}</div>
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 16,
          border: '1px solid var(--border)',
          borderRadius: 8,
        }}
      >
        <h2 style={{ marginTop: 0 }}>{selected.name}</h2>
        <p>{selected.condition}</p>
        <HandView key={selected.key} hand={selected.exampleHand} tileWidth={36} />
      </div>
    </section>
  );
}
