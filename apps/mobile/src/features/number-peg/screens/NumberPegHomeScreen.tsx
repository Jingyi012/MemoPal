import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { MemorySetRow } from '@/components/MemorySetRow';
import { TechniqueHeroCard } from '@/components/TechniqueHeroCard';
import { useMemorySets } from '@/features/memory-sets';
import { NumberPegItemCard } from '@/features/number-peg/components/NumberPegItemCard';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { useNumberPegOverview } from '@/features/number-peg/hooks/useNumberPegOverview';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, RefreshCcw, Sparkles } from 'lucide-react-native';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function NumberPegHomeScreen() {
  const router = useRouter();
  const { items } = useNumberPegOverview();
  const memorySets = useMemorySets('number-peg');

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow="Number Peg"
        title="Number Peg"
        description="Turn a short list into unforgettable mini movies"
        backAction={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={memorySets.isRefetching} onRefresh={memorySets.refetch} />
        }>
        <TechniqueHeroCard
          tone="peg"
          icon={<Sparkles size={26} color={theme.ink} />}
          eyebrow="FAST, PLAYFUL, POWERFUL"
          title="Build a memory in minutes"
          body="Add up to 10 words. MemoPal pairs each one with a fixed number shape and helps you make the scene wonderfully weird."
          actionLabel="Make a new memory"
          onAction={() => router.push('/number-peg/create' as Href)}
        />

        <AnimatedPressable onPress={() => router.push('/number-peg/familiarity' as Href)} style={styles.familiarityCard}>
          <View style={styles.familiarityIcon}><Sparkles size={20} color={theme.berryDeep} /></View>
          <View style={styles.familiarityCopy}>
            <Text style={styles.familiarityTitle}>Learn your 1–10 anchors</Text>
            <Text style={styles.familiarityBody}>A quick picture quiz makes your first memory feel easier.</Text>
          </View>
          <ArrowRight size={18} color={theme.inkSoft} />
        </AnimatedPressable>

        <View style={styles.sectionHeadingRow}>
          <View>
            <Text style={styles.sectionEyebrow}>YOUR PEG SET</Text>
            <Text style={styles.sectionTitle}>One anchor for every number</Text>
          </View>
          <Text style={styles.countPill}>1–10</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pegRail}>
          {items.map((item) => (
            <NumberPegItemCard key={item.id} item={item} />
          ))}
        </ScrollView>

        <View style={styles.sectionHeadingRow}>
          <View>
            <Text style={styles.sectionEyebrow}>YOUR MEMORIES</Text>
            <Text style={styles.sectionTitle}>Ready for a quick recall?</Text>
          </View>
        </View>

        {memorySets.isLoading ? (
          <View style={styles.loadingFrame}>
            <LoadingView description="Finding your memories…" />
          </View>
        ) : memorySets.isError ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>We could not reach MemoPal</Text>
            <Text style={styles.noticeBody}>
              {getNumberPegErrorMessage(memorySets.error, 'Check your connection and try again.')}
            </Text>
            <AnimatedPressable onPress={() => memorySets.refetch()} style={styles.retryButton}>
              <RefreshCcw size={16} color={theme.ink} />
              <Text style={styles.retryText}>Try again</Text>
            </AnimatedPressable>
          </View>
        ) : memorySets.data?.length ? (
          memorySets.data.map((memorySet) => (
            <MemorySetRow
              key={memorySet.id}
              tone="peg"
              title={memorySet.title}
              badgeText={String(memorySet.items.length)}
              subtitle={`${memorySet.items.length} ${memorySet.items.length === 1 ? 'item' : 'items'} · ${memorySet.status === 'draft' ? 'Keep building' : 'Ready to recall'}`}
              onPress={() => router.push(`/number-peg/${memorySet.id}` as Href)}
            />
          ))
        ) : (
          <View style={styles.noticeCard}>
            <Text style={styles.emptyEmoji}>🎒</Text>
            <Text style={styles.noticeTitle}>Your memory bag is empty</Text>
            <Text style={styles.noticeBody}>
              Start with a spelling test, a grocery list, or five fun facts.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 16, paddingBottom: 40 },
  familiarityCard: { minHeight: 72, borderRadius: 18, borderWidth: 2, borderColor: '#FFD9E2', backgroundColor: '#FFF0F4', padding: 12, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  familiarityIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  familiarityCopy: { flex: 1 },
  familiarityTitle: { color: theme.ink, fontSize: 14, fontWeight: '900' },
  familiarityBody: { color: theme.inkSoft, fontSize: 11.5, lineHeight: 17, fontWeight: '700', marginTop: 3 },
  sectionHeadingRow: {
    marginTop: 28,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionEyebrow: { color: theme.berryDeep, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  sectionTitle: { color: theme.ink, fontSize: 17, fontWeight: '900', marginTop: 3 },
  countPill: {
    overflow: 'hidden',
    color: theme.berryDeep,
    backgroundColor: '#FFF0F4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '900',
  },
  pegRail: { marginHorizontal: -16, paddingLeft: 16 },
  noticeCard: {
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  noticeTitle: { color: theme.ink, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  noticeBody: { color: theme.inkSoft, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 5 },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.sun,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },
  retryText: { color: theme.ink, fontSize: 13, fontWeight: '900' },
  emptyEmoji: { fontSize: 31, marginBottom: 9 },
  loadingFrame: { height: 150, overflow: 'hidden', borderRadius: 20 },
});
