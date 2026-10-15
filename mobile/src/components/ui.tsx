import { useState, type ReactNode } from 'react';
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

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  /** 현재 선택값. 생략하면 placeholder만 보여주는 "메뉴형" 드롭다운으로 동작한다 */
  value?: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder: string;
}

/** 버튼 그리드 대신 쓰는 드롭다운. 눌렀을 때 바로 아래에 목록을 펼친다 */
export function Dropdown({ value, options, onChange, placeholder }: DropdownProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.dropdownWrap}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={[styles.dropdownTrigger, { borderColor: theme.border, backgroundColor: theme.surface }]}
      >
        <Text style={{ color: selected ? theme.text : theme.textMuted }}>{selected ? selected.label : placeholder}</Text>
        <Text style={{ color: theme.textMuted }}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && (
        <View style={[styles.dropdownList, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={[styles.dropdownItem, active && { backgroundColor: theme.accentSoft }]}
              >
                <Text style={{ color: active ? theme.accent : theme.text, fontWeight: active ? '700' : '400' }}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
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
  dropdownWrap: { marginBottom: spacing.md },
  dropdownTrigger: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: spacing.md },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
});
