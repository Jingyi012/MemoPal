import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { MemorySetRow } from '@/components/MemorySetRow';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { TechniqueHeroCard } from '@/components/TechniqueHeroCard';
import { useMemorySets } from '@/features/memory-sets';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { NumberPegItemCard } from '@/features/number-peg/components/NumberPegItemCard';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { useNumberPegOverview } from '@/features/number-peg/hooks/useNumberPegOverview';
import { getUnlockedPegCount } from '@/features/number-peg/utils/numberPegMap';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, ChevronRight } from 'lucide-react-native';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function NumberPegHomeScreen() {
  const router = useRouter();
  const { items } = useNumberPegOverview();
  const { user } = useCurrentUser();
  const memorySets = useMemorySets('number-peg');
  const currentLevel = Math.max(1, user?.level ?? 1);
  const unlockedCount = getUnlockedPegCount(currentLevel);
  // The home rail is a preview, not the full library. Keep it scannable on
  // small screens and let the map handle the long 1–100 list.
  const visibleItems = items.slice(0, Math.min(10, unlockedCount));
  const lockedPreview = items.slice(unlockedCount, unlockedCount + 2);

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
          icon={<Text style={styles.heroEmoji}>🕯️</Text>}
          eyebrow="FAST, PLAYFUL, POWERFUL"
          title="Build a memory in minutes"
          body="Add a list and pair each item with a fixed number shape. Start with ten anchors, then unlock more as you level up."
          actionLabel="Make a new memory"
          onAction={() => router.push('/number-peg/create' as Href)}
        />

        <AnimatedPressable onPress={() => router.push('/number-peg/familiarity' as Href)} style={styles.familiarityCard}>
          <View style={styles.familiarityIcon}><Text style={styles.familiarityEmoji}>🧠</Text></View>
          <View style={styles.familiarityCopy}>
            <Text style={styles.familiarityTitle}>Learn your 1–100 anchors</Text>
            <Text style={styles.familiarityBody}>A quick picture quiz makes your first memory feel easier.</Text>
          </View>
          <ArrowRight size={18} color={theme.inkSoft} />
        </AnimatedPressable>

        <View style={styles.sectionHeadingRow}>
          <View style={styles.sectionHeadingCopy}>
            <Text style={styles.sectionEyebrow}>YOUR PEG SET</Text>
            <Text style={styles.sectionTitle}>Your unlocked anchors</Text>
          </View>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel="See all peg anchors"
            onPress={() => router.push('/number-peg/map' as Href)}
            style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See all</Text>
            <ChevronRight size={15} color={theme.berryDeep} />
          </AnimatedPressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pegRail}>
          {visibleItems.map((item) => (
            <NumberPegItemCard key={item.id} item={item} compact />
          ))}
          {lockedPreview.map((item) => (
            <NumberPegItemCard key={item.id} item={item} compact locked />
          ))}
        </ScrollView>
        <Text style={styles.unlockHint}>
          Level {currentLevel} unlocks {unlockedCount} of 100 anchors. Keep practising to open the next set.
        </Text>

        <View style={styles.sectionHeadingRow}>
          <View style={styles.sectionHeadingCopy}>
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
            actionLabel="Make a memory"
            actionIcon={<ArrowRight size={16} color={theme.ink} />}
            onAction={() => router.push('/number-peg/create' as Href)}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 16, paddingBottom: 40 },
  heroEmoji: { fontSize: 27 },
  familiarityCard: { minHeight: 72, borderRadius: 18, borderWidth: 2, borderColor: '#FFD9E2', backgroundColor: '#FFF0F4', padding: 12, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  familiarityIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  familiarityEmoji: { fontSize: 21 },
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
  sectionHeadingCopy: { flex: 1, paddingRight: 10 },
  seeAllButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 1, borderRadius: 999, backgroundColor: '#FFF0F4', paddingLeft: 11, paddingRight: 7 },
  seeAllText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  pegRail: { marginHorizontal: -16, paddingLeft: 16 },
  unlockHint: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 16, marginTop: 8 },
  loadingFrame: { height: 150, overflow: 'hidden', borderRadius: 20 },
});
