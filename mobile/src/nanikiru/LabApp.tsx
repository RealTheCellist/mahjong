import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Tile } from '../components/Tile';
import { tileNameToIndex } from '../engine/tileCodec';
import { NANIKIRU_APP_NAME } from '../branding';
import { LAB_SECTIONS, getLabSubs } from './labContent';
import { labColors, labRadius, labSpacing, labType } from './labTheme';
import { NanikiruDemo } from './NanikiruDemo';
import { TrainingScreen } from './TrainingScreen';
import { UnitTestScreen } from './UnitTestScreen';
import { WrongAnswerScreen } from './WrongAnswerScreen';
import { ComprehensiveScreen } from './ComprehensiveScreen';

const FAN_TILES = ['1m', '1p', '1z', '6z', '7z'];
const FAN_ROTATIONS = [-12, -6, 0, 6, 12];
const FAN_OFFSETS = [10, 2, 0, 2, 10];

type ToolKind = 'viewer' | 'training' | 'unit-test' | 'wrong-answers' | 'comprehensive';

export function LabApp() {
  const [start, setStart] = useState(true);
  const [sec, setSec] = useState(0);
  const [sub, setSub] = useState(-1);
  const [menu, setMenu] = useState(false);
  const [tool, setTool] = useState<ToolKind | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [start, sec, sub]);

  const section = LAB_SECTIONS[sec];
  const subs = getLabSubs(section.chapterId);
  const currentSub = sub >= 0 ? subs[sub] : null;

  const openSection = (index: number) => {
    setSec(index);
    setSub(-1);
    setMenu(false);
  };

  const goHome = () => {
    setMenu(false);
    setStart(true);
  };

  if (tool) {
    const Tool =
      tool === 'viewer'
        ? () => <NanikiruDemo initialChapter={section.chapterId} />
        : tool === 'training'
          ? () => <TrainingScreen initialChapter={section.chapterId} />
          : tool === 'unit-test'
            ? () => <UnitTestScreen initialChapter={section.chapterId} />
            : tool === 'wrong-answers'
              ? () => <WrongAnswerScreen initialChapter={section.chapterId} />
              : () => <ComprehensiveScreen />;
    return (
      <View style={styles.root}>
        <Pressable onPress={() => setTool(null)} style={styles.toolBackBar}>
          <Text style={styles.toolBackText}>← 소제목으로</Text>
        </Pressable>
        <Tool />
      </View>
    );
  }

  if (start) {
    return (
      <View style={[styles.root, { backgroundColor: labColors.primary }]}>
        <View style={styles.startBody}>
          <View style={styles.fan}>
            {FAN_TILES.map((name, i) => (
              <View
                key={name}
                style={{
                  marginLeft: i === 0 ? 0 : -labSpacing.md,
                  transform: [{ rotate: `${FAN_ROTATIONS[i]}deg` }, { translateY: FAN_OFFSETS[i] }],
                }}
              >
                <Tile index={tileNameToIndex(name)} width={44 * 1.2} />
              </View>
            ))}
          </View>
          <Text style={styles.startLabel}>NANIKIRU LAB</Text>
          <Text style={styles.startTitle}>{NANIKIRU_APP_NAME}</Text>
          <Text style={styles.startSub}>버릴 패를 고르는 감각을 기르는 리치 마작 훈련소</Text>
        </View>

        <View style={styles.startActions}>
          <Pressable
            onPress={() => {
              setStart(false);
              setSec(0);
              setSub(-1);
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>시작하기 →</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setStart(false);
              setMenu(true);
            }}
            style={styles.outlineButton}
          >
            <Text style={styles.outlineButtonText}>목차 보기</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: labColors.bg }]}>
      <View style={[styles.topBar, { backgroundColor: labColors.primary }]}>
        <Pressable onPress={() => setMenu(true)} style={styles.menuButton} accessibilityLabel="메뉴 열기">
          <View style={styles.menuBar} />
          <View style={styles.menuBar} />
          <View style={styles.menuBar} />
        </Pressable>
        <Text style={styles.topBarTitle}>{NANIKIRU_APP_NAME}</Text>
        <Text style={styles.topBarPos}>
          {section.no} / {String(LAB_SECTIONS.length).padStart(2, '0')}
        </Text>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        {sub === -1 ? (
          <SecScreen
            section={section}
            subs={subs}
            onOpenSub={(i) => setSub(i)}
          />
        ) : (
          <SubScreen
            chapterLabel={section.title}
            sub={currentSub!}
            subs={subs}
            onSelectSub={(i) => setSub(i)}
            onBack={() => setSub(-1)}
            onOpenTool={(kind) => setTool(kind)}
          />
        )}
      </ScrollView>

      {menu && (
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenu(false)} />
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>대제목</Text>
              <Pressable onPress={() => setMenu(false)} style={styles.closeButton} accessibilityLabel="메뉴 닫기">
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            {LAB_SECTIONS.map((s, i) => {
              const active = !start && i === sec && sub === -1;
              return (
                <Pressable
                  key={s.chapterId}
                  onPress={() => openSection(i)}
                  style={[styles.drawerItem, active && { backgroundColor: labColors.primary }]}
                  aria-current={active ? 'page' : undefined}
                >
                  <Text style={[styles.drawerItemNo, active && { color: labColors.onPrimarySub }]}>{s.no}</Text>
                  <Text style={[styles.drawerItemTitle, { color: active ? labColors.onPrimary : labColors.text }]}>
                    {s.title}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable onPress={goHome} style={styles.drawerHomeButton}>
              <Text style={styles.drawerHomeText}>처음 화면으로</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

interface SecScreenProps {
  section: (typeof LAB_SECTIONS)[number];
  subs: ReturnType<typeof getLabSubs>;
  onOpenSub: (index: number) => void;
}

function SecScreen({ section, subs, onOpenSub }: SecScreenProps) {
  return (
    <View>
      <Text style={styles.secNo}>{section.no}</Text>
      <Text style={styles.secTitle}>{section.title}</Text>
      <Text style={styles.secDesc}>{section.description}</Text>
      <View style={styles.secDivider} />

      <View style={styles.subGrid}>
        {subs.map((s, i) => (
          <Pressable key={s.id} onPress={() => onOpenSub(i)} style={styles.subGridButton}>
            <Text style={styles.subGridTag}>{s.tag}</Text>
            <Text style={styles.subGridTitle} numberOfLines={2}>
              {s.title} ›
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

interface SubScreenProps {
  chapterLabel: string;
  sub: ReturnType<typeof getLabSubs>[number];
  subs: ReturnType<typeof getLabSubs>;
  onSelectSub: (index: number) => void;
  onBack: () => void;
  onOpenTool: (kind: ToolKind) => void;
}

const TOOL_LABELS: { kind: ToolKind; label: string }[] = [
  { kind: 'viewer', label: '손패 뷰어' },
  { kind: 'training', label: '본훈련' },
  { kind: 'unit-test', label: '단원평가' },
  { kind: 'wrong-answers', label: '오답노트' },
  { kind: 'comprehensive', label: '종합응용' },
];

function SubScreen({ chapterLabel, sub, subs, onSelectSub, onBack, onOpenTool }: SubScreenProps) {
  return (
    <View>
      <Pressable onPress={onBack} style={styles.backToSecButton}>
        <Text style={styles.backToSecText}>← 대제목</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTag}>{sub.tag}</Text>
        <Text style={styles.cardTitle}>{sub.title}</Text>
        <Text style={styles.cardBody}>{sub.body}</Text>
      </View>

      <View style={styles.toolRow}>
        {TOOL_LABELS.map(({ kind, label }) => (
          <Pressable key={kind} onPress={() => onOpenTool(kind)} style={styles.toolChip}>
            <Text style={styles.toolChipText}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.otherSubsLabel}>{chapterLabel}의 다른 소제목</Text>
      <View style={styles.chipRow}>
        {subs.map((s, i) => {
          const active = s.id === sub.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => onSelectSub(i)}
              style={[styles.subChip, active && { backgroundColor: labColors.primary }]}
              aria-current={active ? 'page' : undefined}
            >
              <Text style={[styles.subChipText, { color: active ? labColors.onPrimary : labColors.text }]}>
                {s.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  toolBackBar: { padding: labSpacing.md, backgroundColor: labColors.surfaceAlt },
  toolBackText: { ...labType.label, color: labColors.primaryText },

  // start screen
  startBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: labSpacing.xl,
    paddingTop: 72,
  },
  fan: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: labSpacing.xl },
  startLabel: { ...labType.label, color: labColors.onPrimarySub, marginBottom: labSpacing.sm, letterSpacing: 2 },
  startTitle: { ...labType.startTitle, color: labColors.onPrimary, textAlign: 'center', marginBottom: labSpacing.sm },
  startSub: { ...labType.bodyDefault, color: labColors.onPrimarySub, textAlign: 'center' },
  startActions: { paddingHorizontal: labSpacing.xl, paddingBottom: 48, gap: 10 },
  primaryButton: {
    height: 52,
    borderRadius: labRadius.md,
    backgroundColor: labColors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { ...labType.subButtonTitle, fontSize: 16, color: labColors.primary },
  outlineButton: {
    height: 48,
    borderRadius: labRadius.md,
    borderWidth: 1,
    borderColor: '#6E9C88',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: { ...labType.subButtonTitle, color: labColors.onPrimary },

  // top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: labSpacing.md,
    gap: 10,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: labRadius.sm,
    backgroundColor: labColors.primary2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  menuBar: { width: 18, height: 2, borderRadius: 1, backgroundColor: labColors.onPrimary },
  topBarTitle: { ...labType.topBarApp, color: labColors.onPrimary, flex: 1 },
  topBarPos: { ...labType.label, color: labColors.onPrimarySub },

  content: { padding: labSpacing.xl, paddingBottom: 40 },

  // sec screen
  secNo: { ...labType.number, color: labColors.accent, marginBottom: labSpacing.xs },
  secTitle: { ...labType.secTitle, color: labColors.text, marginBottom: labSpacing.xs },
  secDesc: { ...labType.bodyDefault, color: labColors.textBody, marginBottom: labSpacing.lg },
  secDivider: { height: 2, backgroundColor: labColors.primary, marginBottom: labSpacing.xl },
  subGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: labSpacing.sm },
  subGridButton: {
    width: '47%',
    minHeight: 52,
    backgroundColor: labColors.surface,
    borderWidth: 1,
    borderColor: labColors.line,
    borderRadius: labRadius.sm,
    padding: labSpacing.sm,
    justifyContent: 'center',
  },
  subGridTag: { ...labType.tag, color: labColors.primaryText, marginBottom: 4 },
  subGridTitle: { ...labType.subButtonTitle, color: labColors.text },

  // sub screen
  backToSecButton: {
    alignSelf: 'flex-start',
    height: 34,
    paddingHorizontal: labSpacing.md,
    borderRadius: labRadius.sm,
    backgroundColor: labColors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: labSpacing.lg,
  },
  backToSecText: { ...labType.label, color: labColors.primaryText },
  card: {
    backgroundColor: labColors.surface,
    borderRadius: labRadius.xl,
    paddingVertical: labSpacing.xl,
    paddingHorizontal: labSpacing.lg,
    gap: labSpacing.lg,
    marginBottom: labSpacing.xl,
  },
  cardTag: {
    ...labType.tag,
    color: labColors.accent,
    alignSelf: 'flex-start',
  },
  cardTitle: { ...labType.subTitle, color: labColors.text },
  cardBody: { ...labType.subBody, color: labColors.textBody },

  toolRow: { flexDirection: 'row', flexWrap: 'wrap', gap: labSpacing.sm, marginBottom: labSpacing.xl },
  toolChip: {
    height: 34,
    paddingHorizontal: labSpacing.md,
    borderRadius: labRadius.pill,
    backgroundColor: labColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolChipText: { ...labType.label, color: labColors.onPrimary },

  otherSubsLabel: { ...labType.label, color: labColors.textMuted, marginBottom: labSpacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: labSpacing.sm },
  subChip: {
    height: 34,
    paddingHorizontal: labSpacing.md,
    borderRadius: labRadius.pill,
    backgroundColor: labColors.surface,
    borderWidth: 1,
    borderColor: labColors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subChipText: { ...labType.label },

  // menu drawer
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    backgroundColor: labColors.surface,
    paddingTop: labSpacing.xl,
    paddingHorizontal: labSpacing.lg,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: labSpacing.md,
    marginBottom: labSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: labColors.line,
  },
  drawerTitle: { ...labType.menuTitle, color: labColors.text },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 22, color: labColors.text },
  drawerItem: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: labSpacing.sm,
    paddingHorizontal: labSpacing.sm,
    borderRadius: labRadius.sm,
    marginBottom: 4,
  },
  drawerItemNo: { ...labType.number, color: labColors.accent },
  drawerItemTitle: { ...labType.subButtonTitle },
  drawerHomeButton: { marginTop: labSpacing.lg, paddingVertical: labSpacing.md },
  drawerHomeText: { ...labType.label, color: labColors.primaryText },
});
