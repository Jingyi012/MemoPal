import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { MemorySetRow } from '@/components/MemorySetRow';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { TechniqueHeroCard } from '@/components/TechniqueHeroCard';
import { useMemorySets } from '@/features/memory-sets';
import { useFeatureLimits } from '@/features/subscription/hooks/useFeatureLimits';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { usePalaceScenes } from '@/features/palace-scenes/hooks/usePalaceScenes';
import { Href, useRouter } from 'expo-router';
import { Crown, ImagePlus, MapPinned, Pencil } from 'lucide-react-native';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PalaceHomeScreen() {
  const router = useRouter();
  const memorySets = useMemorySets('palace');
  const scenes = usePalaceScenes();
  const { limits } = useFeatureLimits();
  const isRefreshing = memorySets.isRefetching || scenes.isRefetching;

  const refresh = () => Promise.allSettled([memorySets.refetch(), scenes.refetch()]);

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow="Memory Palace"
        title="Memory Palace"
        description="Place memories on one scene, then walk the route"
        backAction={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}>
        <TechniqueHeroCard
          tone="palace"
          icon={<MapPinned size={27} color={theme.ink} />}
          eyebrow="SEE IT · PLACE IT · RECALL IT"
          title="Turn one place into a memory journey"
          body="Choose a scene, place each idea on a numbered locus, and follow the same visual path whenever you want to remember it."
          actionLabel="Build a new Palace"
          onAction={() => router.push('/palaces/create-memory' as Href)}
        />

        <AnimatedPressable
          onPress={() => router.push('/palaces/create-custom' as Href)}
          style={styles.customCard}>
          <View style={styles.customIcon}>
            {limits.customPalaces > 0 ? <ImagePlus size={21} color={theme.violetDeep} /> : <Crown size={20} color={theme.sunDeep} />}
          </View>
          <View style={styles.customCopy}>
            <Text style={styles.customEyebrow}>{limits.customPalaces > 0 ? 'MAKE IT PERSONAL' : 'PREMIUM'}</Text>
            <Text style={styles.customTitle}>Use your own place</Text>
            <Text style={styles.customBody}>Upload one familiar photo and tap the spots you want to remember.</Text>
          </View>
          <Text style={styles.customArrow}>→</Text>
        </AnimatedPressable>

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
          <ModuleNoticeCard
            title="The Palace doors are stuck"
            body={getNumberPegErrorMessage(scenes.error, 'Check your connection and try again.')}
            onAction={scenes.refetch}
          />
        ) : scenes.data?.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sceneRail}>
            {scenes.data.map((scene) => (
              <View key={scene.id} style={styles.sceneCardWrap}>
                <AnimatedPressable
                  onPress={() =>
                    router.push({ pathname: '/palaces/create-memory', params: { sceneId: scene.id } })
                  }
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
                {!scene.isTemplate ? (
                  <AnimatedPressable
                    accessibilityLabel={`Edit ${scene.name}`}
                    onPress={(event) => {
                      event.stopPropagation();
                      router.push(`/palaces/create-custom?sceneId=${encodeURIComponent(scene.id)}` as Href);
                    }}
                    style={styles.sceneEditButton}>
                    <Pencil size={15} color={theme.ink} />
                  </AnimatedPressable>
                ) : null}
              </View>
            ))}
          </ScrollView>
        ) : (
          <ModuleNoticeCard
            title="No Palace scenes yet"
            body="Publish a scene and its loci from the admin studio to start building journeys."
            onAction={scenes.refetch}
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
          <ModuleNoticeCard
            title="We could not reach MemoPal"
            body={getNumberPegErrorMessage(memorySets.error, 'Check your connection and try again.')}
            onAction={memorySets.refetch}
          />
        ) : memorySets.data?.length ? (
          memorySets.data.map((memorySet) => (
            <MemorySetRow
              key={memorySet.id}
              tone="palace"
              title={memorySet.title}
              badgeText={String(memorySet.items.length)}
              subtitle={`${memorySet.items.length} ${memorySet.items.length === 1 ? 'locus' : 'loci'} · ${memorySet.status === 'draft' ? 'Keep placing' : 'Walk and recall'}`}
              onPress={() => router.push(`/palaces/memory/${memorySet.id}` as Href)}
            />
          ))
        ) : (
          <ModuleNoticeCard
            emoji="🗺️"
            title="Your first journey starts here"
            body="Try a school topic, a speech, or the steps of a new skill."
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 16, paddingBottom: 40 },
  sectionHeadingRow: {
    marginTop: 28,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionEyebrow: { color: theme.violetDeep, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  sectionTitle: { color: theme.ink, fontSize: 17, fontWeight: '900', marginTop: 3 },
  countPill: {
    overflow: 'hidden',
    color: theme.violetDeep,
    backgroundColor: '#EEE9FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '900',
  },
  sceneRail: { gap: 12, paddingRight: 8 },
  sceneCardWrap: { width: 240, height: 148 },
  sceneCard: {
    width: 240,
    height: 148,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#DCD4FF',
    borderWidth: 2,
    borderColor: '#DCD4FF',
  },
  sceneImage: { ...StyleSheet.absoluteFillObject },
  sceneShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 38, 43, 0.25)',
  },
  sceneCopy: { position: 'absolute', left: 14, right: 14, bottom: 13 },
  sceneEditButton: { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.9)', alignItems: 'center', justifyContent: 'center' },
  sceneName: { color: 'white', fontSize: 16, fontWeight: '900' },
  sceneMeta: { color: '#E8F7F2', fontSize: 11, fontWeight: '700', marginTop: 3 },
  sceneLoading: { height: 148, overflow: 'hidden', borderRadius: 20 },
  memoryLoading: { height: 150, overflow: 'hidden', borderRadius: 20 },
  customCard: { marginTop: 14, borderRadius: 18, borderWidth: 1.5, borderColor: '#DCD4FF', backgroundColor: '#F7F5FF', padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  customIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EEE9FF', alignItems: 'center', justifyContent: 'center' },
  customCopy: { flex: 1 },
  customEyebrow: { color: theme.violetDeep, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.8 },
  customTitle: { color: theme.ink, fontSize: 14, fontWeight: '900', marginTop: 2 },
  customBody: { color: theme.inkSoft, fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 2 },
  customArrow: { color: theme.violetDeep, fontSize: 22, fontWeight: '900' },
});
