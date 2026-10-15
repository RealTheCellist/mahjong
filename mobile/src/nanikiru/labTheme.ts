/**
 * "나니키루 연구소 디자인 스펙" (2026-10-15) 색상/타이포 토큰.
 * 나니키루 연구소 전용 고정 팔레트로, 입문앱이나 기존 theme.tsx의
 * 라이트/다크 토큰과는 무관하게 항상 이 값을 쓴다.
 *
 * 폰트: 스펙은 Noto Serif KR / IBM Plex Sans KR(구글 폰트)을 지정하지만,
 * 이 프로젝트엔 구글 폰트 로더가 설치돼 있지 않아 새 의존성을 추가하는
 * 대신 serif/시스템 산세리프로 근사했다. 실제 폰트를 쓰려면
 * @expo-google-fonts/noto-serif-kr, @expo-google-fonts/ibm-plex-sans-kr과
 * expo-font를 설치하고 useFonts로 로드해야 한다.
 */
export const labColors = {
  bg: '#F6F2E7',
  surface: '#FFFDF8',
  surfaceAlt: '#EDE6D4',
  primary: '#1F4D3F',
  primary2: '#2C6452',
  primaryText: '#1F5A47',
  onPrimary: '#F6F2E7',
  onPrimarySub: '#CFE3D8',
  text: '#1E2A25',
  textBody: '#333D38',
  textMuted: '#55625B',
  line: '#E2DACA',
  accent: '#B3261E',
  scrim: 'rgba(20, 30, 25, 0.45)',
};

const serif = 'serif';

export const labType = {
  startTitle: { fontFamily: serif, fontSize: 42, fontWeight: '900' as const },
  secTitle: { fontFamily: serif, fontSize: 34, fontWeight: '900' as const },
  subTitle: { fontFamily: serif, fontSize: 30, fontWeight: '700' as const },
  subTitleHanja: { fontFamily: serif, fontSize: 18, fontWeight: '700' as const },
  topBarApp: { fontFamily: serif, fontSize: 18, fontWeight: '700' as const },
  menuTitle: { fontFamily: serif, fontSize: 19, fontWeight: '700' as const },
  statValue: { fontSize: 17, fontWeight: '700' as const },
  subBody: { fontSize: 16, fontWeight: '400' as const, lineHeight: 16 * 1.75 },
  subButtonTitle: { fontSize: 15, fontWeight: '700' as const },
  bodyDefault: { fontSize: 15, fontWeight: '400' as const, lineHeight: 15 * 1.65 },
  number: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 13 * 0.12 },
  label: { fontSize: 13, fontWeight: '600' as const },
  tag: { fontSize: 12, fontWeight: '700' as const },
};

export const labSpacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const labRadius = { sm: 8, md: 10, lg: 12, xl: 18, pill: 999 };
