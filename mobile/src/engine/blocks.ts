import type { Hand34 } from './types';
import { classifyTaatsu, type TaatsuType } from './taatsu';

export type BlockType = 'complete' | 'pair' | 'taatsu';

export interface Block {
  type: BlockType;
  tiles: number[];
  completeKind?: 'shuntsu' | 'kotsu';
  taatsuKind?: TaatsuType;
}

export interface BlockDecomposition {
  blocks: Block[];
  floatingTiles: number[];
  blockCount: number;
  /** 5블록(4멘츠+1페어) 기준 잉여 블록 여부 */
  isSurplus: boolean;
  /** 5블록에 못 미치는지 여부 */
  isInsufficient: boolean;
}

interface SuitResult {
  blocks: Block[];
  floating: number[];
}

const MAX_PER_SUIT = 60;
const MAX_TOTAL = 300;

/** 한 수(m/p/s/z)에 대해 가능한 블록 분해 방법을 모두 탐색한다 (백트래킹) */
function decomposeSuit(counts: number[], base: number, sequential: boolean): SuitResult[] {
  const results: SuitResult[] = [];
  const working = [...counts];

  const nextNonEmpty = (from: number): number => {
    let i = from;
    while (i < working.length && working[i] === 0) i += 1;
    return i;
  };

  const recurse = (pos: number, blocks: Block[], floating: number[]) => {
    if (results.length >= MAX_PER_SUIT) return;

    const idx = nextNonEmpty(pos);
    if (idx >= working.length) {
      results.push({ blocks: [...blocks], floating: [...floating] });
      return;
    }

    const tileIndex = base + idx;

    // 블록(완성 멘츠 > 페어 > 타츠)을 먼저 시도해 블록 수가 많은 분해를 우선 탐색하고,
    // 고립패(플로팅)는 가장 마지막에 시도한다. DFS가 첫 번째로 찾는 결과가 최선에
    // 가깝도록 만들어, per-suit/전체 조합 캡에 걸려도 최적해를 놓치지 않게 한다.

    if (sequential) {
      // 순쯔(run, 완성 멘츠): idx, idx+1, idx+2
      if (idx + 2 < working.length && working[idx + 1] > 0 && working[idx + 2] > 0) {
        working[idx] -= 1;
        working[idx + 1] -= 1;
        working[idx + 2] -= 1;
        const tiles = [tileIndex, base + idx + 1, base + idx + 2];
        blocks.push({ type: 'complete', tiles, completeKind: 'shuntsu' });
        recurse(idx, blocks, floating);
        blocks.pop();
        working[idx] += 1;
        working[idx + 1] += 1;
        working[idx + 2] += 1;
      }
    }

    // 각커/커츠(triplet, 완성 멘츠)
    if (working[idx] >= 3) {
      working[idx] -= 3;
      blocks.push({ type: 'complete', tiles: [tileIndex, tileIndex, tileIndex], completeKind: 'kotsu' });
      recurse(idx, blocks, floating);
      blocks.pop();
      working[idx] += 3;
    }

    // 대짝(pair)
    if (working[idx] >= 2) {
      working[idx] -= 2;
      blocks.push({ type: 'pair', tiles: [tileIndex, tileIndex] });
      recurse(idx, blocks, floating);
      blocks.pop();
      working[idx] += 2;
    }

    if (sequential) {
      // 인접 타츠(료멘/펜찬): idx, idx+1
      if (idx + 1 < working.length && working[idx + 1] > 0) {
        working[idx] -= 1;
        working[idx + 1] -= 1;
        const partnerIndex = base + idx + 1;
        const kind = classifyTaatsu([tileIndex, partnerIndex]).type;
        blocks.push({ type: 'taatsu', tiles: [tileIndex, partnerIndex], taatsuKind: kind });
        recurse(idx, blocks, floating);
        blocks.pop();
        working[idx] += 1;
        working[idx + 1] += 1;
      }

      // 갱짱 타츠(kanchan): idx, idx+2
      if (idx + 2 < working.length && working[idx + 2] > 0) {
        working[idx] -= 1;
        working[idx + 2] -= 1;
        const partnerIndex = base + idx + 2;
        blocks.push({ type: 'taatsu', tiles: [tileIndex, partnerIndex], taatsuKind: 'kanchan' });
        recurse(idx, blocks, floating);
        blocks.pop();
        working[idx] += 1;
        working[idx + 2] += 1;
      }
    }

    // 고립패(플로팅)로 남긴다 — 다른 블록 옵션을 모두 시도한 뒤 마지막 수단으로 시도
    working[idx] -= 1;
    floating.push(tileIndex);
    recurse(idx, blocks, floating);
    floating.pop();
    working[idx] += 1;
  };

  recurse(0, [], []);
  return results;
}

function decompositionSignature(blocks: Block[], floating: number[]): string {
  const blockSigs = blocks
    .map((b) => `${b.type}:${b.tiles.slice().sort((x, y) => x - y).join(',')}`)
    .sort();
  const floatSig = floating.slice().sort((x, y) => x - y).join(',');
  return `${blockSigs.join('|')}#${floatSig}`;
}

/**
 * 손패를 블록(완성 멘츠/페어/타츠) + 고립패로 분해하는 가능한 모든 방법을 찾는다.
 * 5블록(4멘츠+1페어) 이론, 6블록 이론 판정의 기초 데이터로 사용한다.
 */
export function analyzeBlocks(hand: Hand34): BlockDecomposition[] {
  const suits: { counts: number[]; base: number; sequential: boolean }[] = [
    { counts: hand.slice(0, 9), base: 0, sequential: true },
    { counts: hand.slice(9, 18), base: 9, sequential: true },
    { counts: hand.slice(18, 27), base: 18, sequential: true },
    { counts: hand.slice(27, 34), base: 27, sequential: false },
  ];

  const perSuitResults = suits.map(({ counts, base, sequential }) =>
    decomposeSuit(counts, base, sequential),
  );

  const combos: SuitResult[][] = [[]];
  for (const suitResults of perSuitResults) {
    const next: SuitResult[][] = [];
    for (const combo of combos) {
      for (const result of suitResults) {
        next.push([...combo, result]);
        if (next.length >= MAX_TOTAL) break;
      }
      if (next.length >= MAX_TOTAL) break;
    }
    combos.length = 0;
    combos.push(...next);
    if (combos.length >= MAX_TOTAL) break;
  }

  const seen = new Set<string>();
  const decompositions: BlockDecomposition[] = [];

  for (const combo of combos) {
    const blocks = combo.flatMap((r) => r.blocks);
    const floatingTiles = combo.flatMap((r) => r.floating).sort((a, b) => a - b);
    const signature = decompositionSignature(blocks, floatingTiles);
    if (seen.has(signature)) continue;
    seen.add(signature);

    const blockCount = blocks.length;
    decompositions.push({
      blocks,
      floatingTiles,
      blockCount,
      isSurplus: blockCount > 5,
      isInsufficient: blockCount < 5,
    });
  }

  // 고립패가 적을수록(패 활용도가 높을수록) 우선하고, 동률이면 블록 수가 적은
  // (완성 멘츠처럼 큰 블록을 우선 사용한, 불필요하게 잘게 쪼개지 않은) 분해를 우선한다.
  decompositions.sort((a, b) => {
    if (a.floatingTiles.length !== b.floatingTiles.length) {
      return a.floatingTiles.length - b.floatingTiles.length;
    }
    return a.blockCount - b.blockCount;
  });
  return decompositions;
}
