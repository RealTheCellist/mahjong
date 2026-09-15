# 마작 모바일 (React Native / Expo)

웹 앱(`/`)과 별개의 Expo 프로젝트입니다. 웹 앱의 화면 14개를 전부 React
Native 컴포넌트로 포팅했습니다.

## 재사용한 것

`src/engine`, `src/problems`, `src/progress` 는 웹 앱의 순수 TypeScript 로직을
그대로 복사해왔습니다 (React/DOM 의존성이 전혀 없어서 변경 없이 재사용 가능).
이 폴더들의 단위 테스트(61개)도 그대로 통과합니다.

`src/intro/missionLogic.ts`, `yakuCatalog.ts`, `src/nanikiru/theorySlides.ts`,
`wrongAnswerQueue.ts`, `fixedProblems.ts` 도 순수 데이터/로직이라 그대로
복사했습니다.

```bash
npm run test
```

## 화면 구성

`App.tsx`가 웹 앱과 동일한 방식(useState 기반 화면 전환)으로 아래 14개
화면을 전부 연결합니다.

- 홈, 패 종류 골라내기, 슌쯔 만들기, 엔딩
- 정방향 체커, 역 카드 사전, 조건 비교 테이블, 역방향 탐색기
- 손패 뷰어, 이론학습, 본훈련, 단원평가, 오답노트, 종합응용

## 패 이미지 (실물 수준)

웹 앱이 쓰는 `riichi-mahjong-tiles`는 웹 SVG(DOM) 전용이라 RN에서 그대로
쓸 수 없었지만, 숫자만 있는 단순 버전 대신 **원본 벡터 아트를 그대로
가져오는 코드모드**를 작성해서 실물 수준 패 이미지를 그대로 구현했습니다.

- `scripts/convert-tile.mjs`: `@babel/parser`+`traverse`+`generator`로 만든
  코드모드. riichi-mahjong-tiles의 웹 SVG 소스(`<svg>`, `<circle>`,
  `style={{fill:...}}` 등)를 react-native-svg 컴포넌트(`<Svg>`, `<Circle>`,
  `fill=` 같은 직접 prop)로 변환한다. `xmlns`/`xmlnsXlink` 등 RN에 불필요한
  속성도 제거한다.
- `scripts/convert-all-tiles.mjs`: 만수/통수/삭수 1~9 + 자패 7종, 총 34개
  타일을 일괄 변환해 `src/tiles/`에 저장.
- `src/ui/tileComponents.ts`: index(0~33) -> 변환된 타일 컴포넌트 매핑.
  웹 앱의 `tileComponents.ts`와 동일한 구조.
- 웹 앱과 완전히 동일한 벡터 아트(만수 붓글씨체, 통수 원형 무늬, 삭수
  대나무, 자패 한자)가 RN에서도 그대로 렌더링되는 것을 확인했습니다.

원본 라이브러리(`riichi-mahjong-tiles`)가 업데이트되면
`node scripts/convert-all-tiles.mjs`를 다시 실행해서 `src/tiles/`를
갱신하면 됩니다.

## 그 외 새로 만든 것 (RN 전용)

- `src/components/ui.tsx`: Screen/Heading/Body/Button/Card 등 화면마다
  반복되는 레이아웃을 공용 컴포넌트로 정리.
- 웹 앱의 `<select>`(역방향 탐색기), `<table>`(조건 비교 테이블), `<input>`
  검색창 등은 RN에 맞게 가로 스크롤 칩, `View` 기반 표, `TextInput`으로
  대체했습니다.

## 실행 방법

```bash
npm install
npm run web      # 브라우저에서 미리보기 (react-native-web)
npm start        # Expo Go 앱으로 QR 스캔해서 실제 폰에서 확인
```

`npm run web`으로 14개 화면 전부를 이 개발 환경(샌드박스)에서 클릭까지
확인했습니다 (버림패 선택 → 등급 표시, 오답노트 자동 수집, 정렬/검색,
역방향 탐색기 하이라이트 등).

## 남은 작업

- `progress/store.ts`가 지금은 RN에 `localStorage`가 없어 인메모리 폴백으로
  동작함 — 앱을 껐다 켜면 진행률이 초기화됨. `AsyncStorage` 연동 필요.
- 실제 기기(Expo Go)에서의 터치 인터랙션 확인 (이 세션은 시뮬레이터/실기기
  환경이 없어 웹 미리보기로만 검증함)
- 홈 화면 진입 버튼이 많아지면서 스크롤이 길어짐 — 탭/네비게이션 구조
  도입 검토
