/**
 * 차분한 미니멀 디자인 시스템.
 * 입문앱(intro)과 나니키루 연구소(nanikiru)는 같은 베이스(배경/텍스트/여백/타이포)를
 * 공유하되, 포인트 컬러(accent)만 서로 다르게 가져가 두 앱의 톤을 구분한다.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export type AppTone = 'intro' | 'nanikiru';
export type ColorScheme = 'light' | 'dark';

export interface Theme {
  scheme: ColorScheme;
  tone: AppTone;
  bg: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  heading: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  danger: string;
}

const BASE: Record<ColorScheme, Omit<Theme, 'scheme' | 'tone' | 'accent' | 'accentText' | 'accentSoft' | 'danger'>> = {
  light: {
    bg: '#faf9f6',
    surface: '#ffffff',
    border: '#e4e1da',
    text: '#55534d',
    textMuted: '#938f84',
    heading: '#1f1e1b',
  },
  dark: {
    bg: '#17171b',
    surface: '#1f2024',
    border: '#2e2f35',
    text: '#c9c7c2',
    textMuted: '#87857e',
    heading: '#f2f1ee',
  },
};

/** 입문앱 = 마작패의 따뜻한 나무/대나무 톤, 나니키루 연구소 = 차분한 서재풍 남색 톤 */
const ACCENT: Record<AppTone, string> = {
  intro: '#b2622f',
  nanikiru: '#3f6a86',
};

const DANGER: Record<ColorScheme, string> = {
  light: '#a8432f',
  dark: '#d4725d',
};

export function getTheme(scheme: ColorScheme, tone: AppTone): Theme {
  const base = BASE[scheme];
  const accent = ACCENT[tone];
  return {
    ...base,
    scheme,
    tone,
    accent,
    accentText: '#ffffff',
    accentSoft: accent + (scheme === 'dark' ? '2e' : '1c'),
    danger: DANGER[scheme],
  };
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 6, md: 10, lg: 14, pill: 999 };

export const type = {
  heading: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2 },
  subheading: { fontSize: 15, fontWeight: '700' as const },
  body: { fontSize: 14, lineHeight: 21 },
  small: { fontSize: 12 },
};

const ThemeContext = createContext<Theme>(getTheme('light', 'intro'));

export function AppThemeProvider({ tone, children }: { tone: AppTone; children: ReactNode }) {
  const osScheme = useColorScheme();
  const scheme: ColorScheme = osScheme === 'dark' ? 'dark' : 'light';
  const theme = useMemo(() => getTheme(scheme, tone), [scheme, tone]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
