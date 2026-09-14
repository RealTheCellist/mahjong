import { tileNamesToHand34 } from '../engine/tileCodec';
import type { Hand34 } from '../engine/types';

export interface YakuCatalogEntry {
  key: string;
  name: string;
  /** 대략적인 판수 (멘젠 기준) — 교육용 참고치이며 실제 판수는 상황에 따라 달라질 수 있다 */
  han: number;
  menzenOnly: boolean;
  condition: string;
  exampleHand: Hand34;
  exampleWinTile: string;
}

function hand(tiles: string[]): Hand34 {
  return tileNamesToHand34(tiles);
}

/**
 * 역 카드 사전 / 조건 비교 테이블용 데이터.
 * 예시 손패는 직접 구성한 것이며, 조건 설명도 게임의 공개된 규칙을 요약한
 * 것으로 특정 문제집·서적의 해설 문장을 옮긴 것이 아니다.
 */
export const YAKU_CATALOG: YakuCatalogEntry[] = [
  {
    key: 'tanyao',
    name: '탕야오',
    han: 1,
    menzenOnly: false,
    condition: '1·9·자패 없이 2~8 숫자패만으로 손패를 구성하면 성립합니다.',
    exampleHand: hand([
      '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s', '8s',
    ]),
    exampleWinTile: '4p',
  },
  {
    key: 'pinfu',
    name: '핑후',
    han: 1,
    menzenOnly: true,
    condition: '멘젠 상태에서 전부 순쯔로 구성하고, 역패가 아닌 패로 페어를 만들며, 료멘 대기로 화료해야 합니다.',
    exampleHand: hand([
      '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s', '8s',
    ]),
    exampleWinTile: '4p',
  },
  {
    key: 'yakuhai_dragon',
    name: '역패(삼원패)',
    han: 1,
    menzenOnly: false,
    condition: '백·발·중 중 한 가지로 커츠(또는 깡)를 만들면 성립합니다.',
    exampleHand: hand([
      '7z', '7z', '7z', '2m', '3m', '4m', '5p', '6p', '7p', '7s', '8s', '9s', '9m', '9m',
    ]),
    exampleWinTile: '6p',
  },
  {
    key: 'iipeiko',
    name: '이페코',
    han: 1,
    menzenOnly: true,
    condition: '멘젠 상태에서 완전히 동일한 순쯔 두 벌을 가지고 있으면 성립합니다.',
    exampleHand: hand([
      '2m', '2m', '3m', '3m', '4m', '4m', '5p', '6p', '7p', '7s', '8s', '9s', '9p', '9p',
    ]),
    exampleWinTile: '4m',
  },
  {
    key: 'toitoi',
    name: '또이또이',
    han: 2,
    menzenOnly: false,
    condition: '4멘츠 전부 커츠(또는 깡)로 구성하면 성립합니다.',
    exampleHand: hand([
      '1m', '1m', '1m', '2p', '2p', '2p', '3s', '3s', '3s', '4s', '4s', '4s', '5p', '5p',
    ]),
    exampleWinTile: '1m',
  },
  {
    key: 'honitsu',
    name: '혼일색',
    han: 2,
    menzenOnly: false,
    condition: '한 가지 수패(만/통/삭 중 하나) + 자패만으로 손패를 구성하면 성립합니다.',
    exampleHand: hand([
      '1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', '1z', '1z', '1z', '5s', '5s',
    ]),
    exampleWinTile: '5s',
  },
  {
    key: 'chinitsu',
    name: '청일색',
    han: 5,
    menzenOnly: false,
    condition: '한 가지 수패만으로 손패를 구성하면 성립합니다 (자패 불가).',
    exampleHand: hand([
      '1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', '2s', '3s', '4s', '5s', '5s',
    ]),
    exampleWinTile: '5s',
  },
  {
    key: 'menzen_tsumo',
    name: '멘젠 쯔모',
    han: 1,
    menzenOnly: true,
    condition: '멘젠 상태에서 쯔모(자기 스스로 뽑아서 화료)로 완성하면 성립합니다.',
    exampleHand: hand([
      '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s', '8s',
    ]),
    exampleWinTile: '4p',
  },
  {
    key: 'riichi',
    name: '리치',
    han: 1,
    menzenOnly: true,
    condition: '멘젠 텐파이 상태에서 1000점을 걸고 리치를 선언하면 성립합니다.',
    exampleHand: hand([
      '2m', '3m', '4m', '5m', '5m', '4p', '5p', '6p', '3s', '4s', '5s', '6s', '7s', '8s',
    ]),
    exampleWinTile: '4p',
  },
];
