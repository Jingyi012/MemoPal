import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useMemorySets } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { usePalaceScenes } from '@/features/palace-scenes';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, ChevronRight, MapPinned, Plus, RefreshCcw } from 'lucide-react-native';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PalaceHomeScreen() {
  const router = useRouter();
  const memorySets = useMemorySets('palace');
  const scenes = usePalaceScenes();
  const isRefreshing = memorySets.isRefetching || scenes.isRefetching;

  const refresh = () => Promise.allSettled([memorySets.refetch(), scenes.refetch()]);

  return (
    <View style={styles.page}>
      <CommonHeader
        title="Memory Palace"
        description="Place memories on one scene, then walk the route"
        backAction={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}>
        <LinearGradient
          colors={['#124E52', '#183947']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroIcon}>
            <MapPinned size={27} color="#163B3F" />
          </View>
          <Text style={styles.heroEyebrow}>SEE IT · PLACE IT · RECALL IT</Text>
          <Text style={styles.heroTitle}>Turn one place into a memory journey</Text>
          <Text style={styles.heroBody}>
            Choose a scene, place each idea on a numbered locus, and follow the same visual path
            whenever you want to remember it.
          </Text>
          <AnimatedPressable
            accessibilityRole="button"
            onPress={() => router.push('/palaces/create-memory' as Href)}
            style={styles.primaryButton}>
            <Plus size={20} color="#163B3F" />
            <Text style={styles.primaryButtonText}>Build a new Palace</Text>
            <ArrowRight size={19} color="#163B3F" />
          </AnimatedPressable>
        </LinearGradient>

        <View style={styles.sectionHeadingRow}>
          <View>
            <Text style={styles.sectionEyebrow}>CHOOSE A FAMILIAR PATH</Text>
            <Text style={styles.sectionTitle}>Palace scenes</Text>
          </View>
          {scenes.data?.length ? <Text style={styles.countPill}>{scenes.data.length}</Text> : null}
        </View>

        {scenes.isLoading ? (
          <View style={styles.sceneLoading}>
            <LoadingView description="Opening the Palace doors…" />
          </View>
        ) : scenes.isError ? (
          <Notice
            title="The Palace doors are stuck"
            body={getNumberPegErrorMessage(scenes.error, 'Check your connection and try again.')}
            onRetry={scenes.refetch}
          />
        ) : scenes.data?.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sceneRail}>
            {scenes.data.map((scene) => (
              <AnimatedPressable
                key={scene.id}
                onPress={() => router.push('/palaces/create-memory' as Href)}
                style={styles.sceneCard}>
                <AppImage imageUrl={scene.imageUrl} style={styles.sceneImage} />
                <View style={styles.sceneShade} />
                <View style={styles.sceneCopy}>
                  <Text numberOfLines={1} style={styles.sceneName}>
                    {scene.name}
                  </Text>
                  <Text style={styles.sceneMeta}>{scene.loci.length} memorable loci</Text>
                </View>
              </AnimatedPressable>
            ))}
          </ScrollView>
        ) : (
          <Notice
            title="No Palace scenes yet"
            body="Publish a scene and its loci from the admin studio to start building journeys."
            onRetry={scenes.refetch}
          />
        )}

        <View style={styles.sectionHeadingRow}>
          <View>
            <Text style={styles.sectionEyebrow}>YOUR JOURNEYS</Text>
            <Text style={styles.sectionTitle}>Ready for a mental walk?</Text>
          </View>
        </View>

        {memorySets.isLoading ? (
          <View style={styles.memoryLoading}>
            <LoadingView description="Finding your Palaces…" />
          </View>
        ) : memorySets.isError ? (
          <Notice
            title="We could not reach MemoPal"
            body={getNumberPegErrorMessage(memorySets.error, 'Check your connection and try again.')}
            onRetry={memorySets.refetch}
          />
        ) : memorySets.data?.length ? (
          memorySets.data.map((memorySet) => (
            <AnimatedPressable
              key={memorySet.id}
              onPress={() => router.push(`/palaces/memory/${memorySet.id}` as Href)}
              style={styles.memoryCard}>
              <View style={styles.memoryBadge}>
                <Text style={styles.memoryBadgeText}>{memorySet.items.length}</Text>
              </View>
              <View style={styles.memoryMeta}>
                <Text numberOfLines={1} style={styles.memoryTitle}>
                  {memorySet.title}
                </Text>
                <Text style={styles.memorySub}>
                  {memorySet.items.length} {memorySet.items.length === 1 ? 'locus' : 'loci'} ·{' '}
                  {memorySet.status === 'draft' ? 'Keep placing' : 'Walk and recall'}
                </Text>
              </View>
              <ChevronRight size={20} color={theme.inkSoft} />
            </AnimatedPressable>
          ))
        ) : (
          <View style={styles.noticeCard}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
            <Text style={styles.noticeTitle}>Your first journey starts here</Text>
            <Text style={styles.noticeBody}>
              Try a school topic, a speech, or the steps of a new skill.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Notice({
  title,
  body,
  onRetry,
}: {
  title: string;
  body: string;
  onRetry: () => unknown;
}) {
  return (
    <View style={styles.noticeCard}>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeBody}>{body}</Text>
      <AnimatedPressable onPress={onRetry} style={styles.retryButton}>
        <RefreshCcw size={16} color={theme.ink} />
        <Text style={styles.retryText}>Try again</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 16, paddingBottom: 40 },
  hero: { borderRadius: 26, padding: 20, overflow: 'hidden' },
  heroGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -55,
    top: -75,
    backgroundColor: 'rgba(129, 226, 188, 0.18)',
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#8CE1BE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  heroEyebrow: { color: '#C9E7DF', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  heroTitle: { color: 'white', fontSize: 25, fontWeight: '900', marginTop: 6 },
  heroBody: { color: '#DCEFEB', fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 320 },
  primaryButton: {
    marginTop: 20,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#8CE1BE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: '#4BA984',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  primaryButtonText: { color: '#163B3F', fontSize: 15, fontWeight: '900', flex: 1, textAlign: 'center' },
  sectionHeadingRow: {
    marginTop: 28,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionEyebrow: { color: '#247B67', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  sectionTitle: { color: theme.ink, fontSize: 17, fontWeight: '900', marginTop: 3 },
  countPill: {
    overflow: 'hidden',
    color: '#247B67',
    backgroundColor: '#E3F6ED',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '900',
  },
  sceneRail: { gap: 12, paddingRight: 8 },
  sceneCard: {
    width: 240,
    height: 148,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#D9E6E1',
  },
  sceneImage: { ...StyleSheet.absoluteFillObject },
  sceneShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 38, 43, 0.25)',
  },
  sceneCopy: { position: 'absolute', left: 14, right: 14, bottom: 13 },
  sceneName: { color: 'white', fontSize: 16, fontWeight: '900' },
  sceneMeta: { color: '#E8F7F2', fontSize: 11, fontWeight: '700', marginTop: 3 },
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
    backgroundColor: '#E3F6ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryBadgeText: { color: '#247B67', fontSize: 18, fontWeight: '900' },
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
  sceneLoading: { height: 148, overflow: 'hidden', borderRadius: 20 },
  memoryLoading: { height: 150, overflow: 'hidden', borderRadius: 20 },
});
