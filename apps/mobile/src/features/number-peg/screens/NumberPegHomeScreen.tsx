import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { MemorySetRow } from '@/components/MemorySetRow';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { TechniqueHeroCard } from '@/components/TechniqueHeroCard';
import { useMemorySets } from '@/features/memory-sets';
import { NumberPegItemCard } from '@/features/number-peg/components/NumberPegItemCard';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { useNumberPegOverview } from '@/features/number-peg/hooks/useNumberPegOverview';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, Sparkles } from 'lucide-react-native';
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
          <ModuleNoticeCard
            title="We could not reach MemoPal"
            body={getNumberPegErrorMessage(memorySets.error, 'Check your connection and try again.')}
            onAction={() => memorySets.refetch()}
          />
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
          <ModuleNoticeCard
            emoji="🎒"
            title="Your memory bag is empty"
            body="Start with a spelling test, a grocery list, or five fun facts."
          />
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
  familiarityTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  familiarityBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11.5, lineHeight: 17, marginTop: 3 },
  sectionHeadingRow: {
    marginTop: 28,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionEyebrow: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 1 },
  sectionTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 17, marginTop: 3 },
  countPill: {
    overflow: 'hidden',
    color: theme.berryDeep,
    backgroundColor: '#FFF0F4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontFamily: typography.bodyExtraBold,
    fontSize: 11,
  },
  pegRail: { marginHorizontal: -16, paddingLeft: 16 },
  loadingFrame: { height: 150, overflow: 'hidden', borderRadius: 20 },
});
