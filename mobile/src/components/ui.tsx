import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, type, useTheme } from '../theme';

export function Screen({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.screenContent}
    >
      {children}
    </ScrollView>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <Text style={[type.heading, styles.heading, { color: theme.heading }]}>{children}</Text>;
}

export function Body({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <Text style={[type.body, styles.body, { color: theme.text }]}>{children}</Text>;
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({ title, onPress, disabled, variant = 'secondary' }: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? theme.accent : theme.surface,
          borderColor: isPrimary ? theme.accent : theme.border,
        },
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, { color: isPrimary ? theme.accentText : theme.text }]}>{title}</Text>
    </Pressable>
  );
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

/** 챕터/모드 선택 칩. Button과 달리 "선택됨"을 음영이 아니라 포인트 컬러로 표시한다 */
interface TabProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function Tab({ label, active, onPress }: TabProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={active}
      style={[
        styles.tab,
        {
          backgroundColor: active ? theme.accentSoft : theme.surface,
          borderColor: active ? theme.accent : theme.border,
        },
      ]}
    >
      <Text style={[styles.tabText, { color: active ? theme.accent : theme.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

export function TabRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

export function Card({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heading: { marginBottom: spacing.sm },
  body: { marginBottom: spacing.md },
  button: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  buttonText: { fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.md },
  tab: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  tabText: { fontWeight: '600', fontSize: 13 },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
});
