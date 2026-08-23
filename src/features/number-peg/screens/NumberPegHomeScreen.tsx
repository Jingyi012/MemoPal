import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useMemorySets } from '@/features/memory-sets';
import { NumberPegItemCard } from '@/features/number-peg/components/NumberPegItemCard';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { useNumberPegOverview } from '@/features/number-peg/hooks/useNumberPegOverview';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, ChevronRight, Plus, RefreshCcw, Sparkles } from 'lucide-react-native';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function NumberPegHomeScreen() {
  const router = useRouter();
  const { items } = useNumberPegOverview();
  const memorySets = useMemorySets('number-peg');

  return (
    <View style={styles.page}>
      <CommonHeader
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
        <LinearGradient
          colors={[theme.night, theme.nightDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroIcon}>
            <Sparkles size={26} color={theme.ink} />
          </View>
          <Text style={styles.heroEyebrow}>FAST, PLAYFUL, POWERFUL</Text>
          <Text style={styles.heroTitle}>Build a memory in minutes</Text>
          <Text style={styles.heroBody}>
            Add up to 10 words. MemoPal pairs each one with a fixed number shape and helps you
            make the scene wonderfully weird.
          </Text>
          <AnimatedPressable
            accessibilityRole="button"
            onPress={() => router.push('/number-peg/create' as Href)}
            style={styles.primaryButton}>
            <Plus size={20} color={theme.ink} />
            <Text style={styles.primaryButtonText}>Make a new memory</Text>
            <ArrowRight size={19} color={theme.ink} />
          </AnimatedPressable>
        </LinearGradient>

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
            <AnimatedPressable
              key={memorySet.id}
              onPress={() => router.push(`/number-peg/${memorySet.id}` as Href)}
              style={styles.memoryCard}>
              <View style={styles.memoryBadge}>
                <Text style={styles.memoryBadgeText}>{memorySet.items.length}</Text>
              </View>
              <View style={styles.memoryMeta}>
                <Text numberOfLines={1} style={styles.memoryTitle}>
                  {memorySet.title}
                </Text>
                <Text style={styles.memorySub}>
                  {memorySet.items.length} {memorySet.items.length === 1 ? 'item' : 'items'} ·{' '}
                  {memorySet.status === 'draft' ? 'Keep building' : 'Ready to recall'}
                </Text>
              </View>
              <ChevronRight size={20} color={theme.inkSoft} />
            </AnimatedPressable>
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
  hero: { borderRadius: 26, padding: 20, overflow: 'hidden' },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -60,
    top: -70,
    backgroundColor: 'rgba(255, 201, 60, 0.18)',
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: theme.sun,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  heroEyebrow: { color: '#C9C5E0', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  heroTitle: { color: 'white', fontSize: 25, fontWeight: '900', marginTop: 6 },
  heroBody: { color: '#E4E1F1', fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 315 },
  primaryButton: {
    marginTop: 20,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: theme.sun,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: theme.sunDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  primaryButtonText: { color: theme.ink, fontSize: 15, fontWeight: '900', flex: 1, textAlign: 'center' },
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
  memoryCard: {
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    padding: 13,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memoryBadge: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#FFF0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryBadgeText: { color: theme.berryDeep, fontSize: 18, fontWeight: '900' },
  memoryMeta: { flex: 1, marginHorizontal: 12 },
  memoryTitle: { color: theme.ink, fontSize: 15, fontWeight: '900' },
  memorySub: { color: theme.inkSoft, fontSize: 12, fontWeight: '700', marginTop: 3 },
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
