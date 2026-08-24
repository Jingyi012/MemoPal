import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useMemorySet } from '@/features/memory-sets';
import type { MemorySet } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, Check, Hash, MapPinned, RefreshCcw } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function MemorySetDetailScreen({ memorySetId }: { memorySetId: string }) {
  const router = useRouter();
  const query = useMemorySet(memorySetId);

  if (query.isLoading) return <LoadingView description="Opening your session…" />;

  if (query.isError || !query.data) {
    return (
      <View style={styles.page}>
        <CommonHeader eyebrow="Session" title="Session details" description="Memory unavailable" backAction={() => router.back()} />
        <View style={styles.centerState}>
          <Text style={styles.stateEmoji}>🧩</Text>
          <Text style={styles.stateTitle}>This memory did not load</Text>
          <Text style={styles.stateBody}>Check your connection and try again.</Text>
          <AnimatedPressable onPress={() => query.refetch()} style={styles.retryButton}>
            <RefreshCcw size={16} color={theme.ink} />
            <Text style={styles.retryButtonText}>Try again</Text>
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  const memorySet = query.data;
  const isPalace = memorySet.techniqueKey === 'palace';
  const playerRoute = (isPalace ? `/palaces/memory/${memorySet.id}` : `/number-peg/${memorySet.id}`) as Href;
  const retryRoute = (isPalace ? `/palaces/memory/${memorySet.id}` : `/number-peg/${memorySet.id}?restart=1`) as Href;

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow="Session"
        title="Session details"
        description={`${isPalace ? 'Memory Palace' : 'Number Peg'} · ${memorySet.items.length} items`}
        backAction={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SummaryCard memorySet={memorySet} />

        <Text style={styles.sectionLabel}>Your memory items</Text>
        <View style={styles.itemList}>
          {memorySet.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={[styles.itemNumber, isPalace ? styles.itemNumberPalace : styles.itemNumberPeg]}>
                <Text style={styles.itemNumberText}>{item.position}</Text>
              </View>
              <View style={styles.itemCopy}>
                <Text style={styles.itemPrompt}>{item.prompt}</Text>
                <Text numberOfLines={1} style={styles.itemAnswer}>{item.answer}</Text>
              </View>
              <View style={styles.readyBadge}>
                <Check size={13} color={theme.grass} />
                <Text style={styles.readyText}>Ready</Text>
              </View>
            </View>
          ))}
        </View>

        <AnimatedPressable onPress={() => router.push(playerRoute)} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Resume session</Text>
          <ArrowRight size={18} color={theme.ink} />
        </AnimatedPressable>
        <AnimatedPressable onPress={() => router.push(retryRoute)} style={styles.secondaryButton}>
          <RefreshCcw size={16} color={theme.inkSoft} />
          <Text style={styles.secondaryButtonText}>Retry from scratch</Text>
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}

function SummaryCard({ memorySet }: { memorySet: MemorySet }) {
  const isPalace = memorySet.techniqueKey === 'palace';
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, isPalace ? styles.summaryIconPalace : styles.summaryIconPeg]}>
        {isPalace ? <MapPinned size={25} color={theme.violetDeep} /> : <Hash size={25} color={theme.berryDeep} />}
      </View>
      <View style={styles.summaryCopy}>
        <Text style={[styles.techniqueLabel, isPalace ? styles.palaceLabel : styles.pegLabel]}>
          {isPalace ? 'MEMORY PALACE' : 'NUMBER PEG'}
        </Text>
        <Text style={styles.summaryTitle}>{memorySet.title}</Text>
        <Text style={styles.summaryMeta}>{memorySet.items.length} items · Ready to practice</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 16, paddingBottom: 42 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 21, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 15 },
  summaryIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  summaryIconPalace: { backgroundColor: '#EEE9FF' },
  summaryIconPeg: { backgroundColor: '#FFF0F4' },
  summaryCopy: { flex: 1, marginLeft: 13 },
  techniqueLabel: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.8 },
  palaceLabel: { color: theme.violetDeep },
  pegLabel: { color: theme.berryDeep },
  summaryTitle: { color: theme.ink, fontSize: 18, fontWeight: '900', marginTop: 4 },
  summaryMeta: { color: theme.inkSoft, fontSize: 11.5, fontWeight: '700', marginTop: 3 },
  sectionLabel: { color: theme.inkSoft, fontSize: 12, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 },
  itemList: { borderRadius: 19, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 13 },
  itemRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.line },
  itemRowLast: { borderBottomWidth: 0 },
  itemNumber: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  itemNumberPalace: { backgroundColor: theme.violet },
  itemNumberPeg: { backgroundColor: theme.sun },
  itemNumberText: { color: theme.ink, fontSize: 11, fontWeight: '900' },
  itemCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  itemPrompt: { color: theme.inkSoft, fontSize: 10, fontWeight: '800' },
  itemAnswer: { color: theme.ink, fontSize: 13, fontWeight: '900', marginTop: 2 },
  readyBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 8 },
  readyText: { color: theme.grass, fontSize: 10, fontWeight: '900' },
  primaryButton: { minHeight: 53, borderRadius: 16, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, shadowColor: theme.sunDeep, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  primaryButtonText: { color: theme.ink, fontSize: 15, fontWeight: '900' },
  secondaryButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 4 },
  secondaryButtonText: { color: theme.inkSoft, fontSize: 12, fontWeight: '800' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateEmoji: { fontSize: 36 },
  stateTitle: { color: theme.ink, fontSize: 18, fontWeight: '900', marginTop: 10 },
  stateBody: { color: theme.inkSoft, fontSize: 13, textAlign: 'center', marginTop: 5 },
  retryButton: { marginTop: 15, borderRadius: 12, backgroundColor: theme.sun, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  retryButtonText: { color: theme.ink, fontSize: 12, fontWeight: '900' },
});
