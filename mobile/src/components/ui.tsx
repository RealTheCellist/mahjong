import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      {children}
    </ScrollView>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({ title, onPress, disabled, variant = 'secondary' }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={[styles.buttonText, variant === 'primary' && styles.buttonTextPrimary]}>{title}</Text>
    </Pressable>
  );
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={styles.buttonRow}>{children}</View>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  screenContent: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: '#161616' },
  body: { fontSize: 14, color: '#444', marginBottom: 12, lineHeight: 20 },
  button: {
    backgroundColor: '#eee6d3',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: { backgroundColor: '#2471a3' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontWeight: '700', color: '#4a4530' },
  buttonTextPrimary: { color: '#fff' },
  buttonRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  card: { borderWidth: 1, borderColor: '#e0dac6', borderRadius: 8, padding: 14, marginBottom: 12 },
});
