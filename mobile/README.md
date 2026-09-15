# 마작 모바일 (React Native / Expo) — 핵심 검증 단계

웹 앱(`/`)과 별개의 Expo 프로젝트입니다. 아직 전체 화면을 포팅한 것이 아니라,
**"룰 엔진 로직이 React Native에서도 그대로 동작하는가"** 를 검증하는 1차 단계입니다.

## 재사용한 것

`src/engine`, `src/problems`, `src/progress` 는 웹 앱의 순수 TypeScript 로직을
그대로 복사해왔습니다 (React/DOM 의존성이 전혀 없어서 변경 없이 재사용 가능).
이 폴더들의 단위 테스트(61개)도 그대로 통과합니다.

```bash
npm run test
```

## 새로 만든 것

- `src/components/Tile.tsx`, `HandView.tsx`: `react-native-svg` 기반 최소 패 렌더러.
  웹 앱이 쓰는 `riichi-mahjong-tiles` 라이브러리는 웹 SVG(DOM) 전용이라 RN에서
  그대로 쓸 수 없어서, 숫자+종류만 표시하는 단순한 버전으로 우선 검증했습니다.
  실물 패 수준의 아트를 원하면 `react-native-svg`로 다시 그리거나 이미지 에셋을
  써야 합니다.
- `App.tsx`: 나니키루 본훈련의 핵심 루프(문제 생성 → 버림패 선택 → 등급 표시)만
  단일 화면으로 구현.

## 실행 방법

```bash
npm install
npm run web      # 브라우저에서 미리보기 (react-native-web)
npm start        # Expo Go 앱으로 QR 스캔해서 실제 폰에서 확인
```

`npm run web`은 이 개발 환경(샌드박스)에서도 정상 동작을 확인했습니다.
실제 폰에서 확인하려면 `npm start` 실행 후 뜨는 QR코드를 Expo Go 앱으로
스캔하면 됩니다.

## 남은 작업

- 웹 앱의 나머지 14개 화면 포팅
- 패 아트를 실물 수준으로 개선 (react-native-svg 재작성 또는 이미지 에셋)
- `progress/store.ts`가 지금은 RN에 `localStorage`가 없어 인메모리 폴백으로
  동작함 — 앱을 껐다 켜면 진행률이 초기화됨. `AsyncStorage` 연동 필요.
- 실제 기기(Expo Go)에서의 터치 인터랙션 확인 (이 세션은 시뮬레이터/실기기
  환경이 없어 웹 미리보기로만 검증함)
