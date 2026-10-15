import { useState } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { getTheme, spacing, useTheme, type AppTone } from '../theme';

export interface NavTreeItem {
  value: string;
  label: string;
}

export interface NavTreeSection {
  key: string;
  label: string;
  tone: AppTone;
  items: NavTreeItem[];
}

interface NavMenuProps {
  sections: NavTreeSection[];
  onNavigateHome: () => void;
  onNavigate: (value: string) => void;
}

/** 큰 제목(앱 섹션) 간 이동을 위한 삼선 메뉴. 누르면 트리 구조 메뉴가 펼쳐진다 */
export function NavMenu({ sections, onNavigateHome, onNavigate }: NavMenuProps) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(sections.map((s) => s.key)));

  const toggleSection = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleNavigate = (value: string) => {
    setOpen(false);
    onNavigate(value);
  };

  return (
    <>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.hamburger} hitSlop={8}>
        <View style={[styles.bar, { backgroundColor: theme.heading }]} />
        <View style={[styles.bar, { backgroundColor: theme.heading }]} />
        <View style={[styles.bar, { backgroundColor: theme.heading }]} />
      </Pressable>

      {open && (
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Pressable
              onPress={() => {
                setOpen(false);
                onNavigateHome();
              }}
              style={styles.homeItem}
            >
              <Text style={[styles.homeText, { color: theme.heading }]}>🏠 홈</Text>
            </Pressable>

            {sections.map((section) => {
              const isOpen = expanded.has(section.key);
              const sectionAccent = getTheme(scheme, section.tone).accent;
              return (
                <View key={section.key}>
                  <Pressable onPress={() => toggleSection(section.key)} style={styles.sectionHeader}>
                    <Text style={[styles.sectionText, { color: sectionAccent }]}>
                      {isOpen ? '▾' : '▸'} {section.label}
                    </Text>
                  </Pressable>
                  {isOpen &&
                    section.items.map((item) => (
                      <Pressable key={item.value} onPress={() => handleNavigate(item.value)} style={styles.leafItem}>
                        <Text style={{ color: theme.text }}>{item.label}</Text>
                      </Pressable>
                    ))}
                </View>
              );
            })}
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hamburger: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: 4, alignSelf: 'flex-start' },
  bar: { width: 22, height: 2, borderRadius: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 260,
    borderRightWidth: 1,
    paddingTop: 56,
    paddingHorizontal: spacing.md,
  },
  homeItem: { paddingVertical: spacing.sm, marginBottom: spacing.sm },
  homeText: { fontSize: 16, fontWeight: '700' },
  sectionHeader: { paddingVertical: spacing.sm },
  sectionText: { fontSize: 15, fontWeight: '700' },
  leafItem: { paddingVertical: 8, paddingLeft: spacing.lg },
});
