import { describe, expect, it } from 'vitest';
import { YAKU_CATALOG } from '../yakuCatalog';
import { checkYaku } from '../../engine/yaku';
import { tileNameToIndex } from '../../engine/tileCodec';

describe('YAKU_CATALOG', () => {
  it('각 항목의 예시 손패는 실제로 해당 역이 성립한다', () => {
    for (const entry of YAKU_CATALOG) {
      const winTile = tileNameToIndex(entry.exampleWinTile);
      const isTsumo = entry.key === 'menzen_tsumo';
      const isRiichi = entry.key === 'riichi';
      const result = checkYaku(entry.exampleHand, { winTile, isTsumo, isRiichi });
      const keys = result.map((r) => r.key);
      expect(keys, `${entry.name} 예시 손패에서 ${entry.key}가 성립해야 함`).toContain(entry.key);
    }
  });

  it('키는 서로 중복되지 않는다', () => {
    const keys = YAKU_CATALOG.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
