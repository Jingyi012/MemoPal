import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { MemorySetRow } from '@/components/MemorySetRow';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { TechniqueHeroCard } from '@/components/TechniqueHeroCard';
import { useMemorySets } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { usePalaceScenes } from '@/features/palace-scenes/hooks/usePalaceScenes';
import { Href, useRouter } from 'expo-router';
import { ChevronRight, Pencil } from 'lucide-react-native';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';

export default function PalaceHomeScreen() {
  const router = useRouter();
  const { t } = useTranslation('palace');
  const memorySets = useMemorySets('palace');
  const scenes = usePalaceScenes();
  const isRefreshing = memorySets.isRefetching || scenes.isRefetching;

  const refresh = () => Promise.allSettled([memorySets.refetch(), scenes.refetch()]);

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        backAction={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}>
        <TechniqueHeroCard
          tone="palace"
          icon={<Text style={styles.heroEmoji}>🏰</Text>}
          eyebrow={t('memoryTip')}
          title={t('description')}
          body={t('routeBody')}
          actionLabel={t('buildNewPalace')}
          onAction={() => router.push('/palaces/create-memory' as Href)}
        />

        <AnimatedPressable
          accessibilityLabel={t('useYourOwnPlace')}
          // Let everyone open the editor to understand the workflow. The
          // editor still enforces the server-backed Premium limit when saving.
          onPress={() => router.push('/palaces/create-custom' as Href)}
          style={styles.customCard}>
          <View style={styles.customIcon}>
            <Text style={styles.customEmoji}>🖼️</Text>
          </View>
          <View style={styles.customCopy}>
            <Text style={styles.customEyebrow}>{t('makeItPersonal')}</Text>
            <Text style={styles.customTitle}>{t('useYourOwnPlace')}</Text>
            <Text style={styles.customBody}>{t('uploadFamiliarPhoto')}</Text>
          </View>
          <Text style={styles.customArrow}>→</Text>
        </AnimatedPressable>

        <View style={styles.sectionHeadingRow}>
          <View style={styles.sectionHeadingCopy}>
            <Text style={styles.sectionEyebrow}>{t('chooseFamiliarPath')}</Text>
            <Text style={styles.sectionTitle}>{t('palaceScenes')}</Text>
          </View>
          {scenes.data?.length ? (
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={t('seeAllScenes')}
              onPress={() => router.push('/palaces/map' as Href)}
              style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>{t('seeAllScenes')}</Text>
              <ChevronRight size={15} color={theme.violetDeep} />
            </AnimatedPressable>
          ) : null}
        </View>

        {scenes.isLoading ? (
          <View style={styles.sceneLoading}>
            <LoadingView description={t('loading')} />
          </View>
        ) : scenes.isError ? (
          <ModuleNoticeCard
            title={t('doorsStuck')}
            body={getNumberPegErrorMessage(scenes.error, t('connection'))}
            onAction={scenes.refetch}
          />
        ) : scenes.data?.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sceneRail}>
            {scenes.data.slice(0, 4).map((scene) => (
              <View key={scene.id} style={styles.sceneCardWrap}>
                <AnimatedPressable
                  onPress={() =>
                    router.push({ pathname: '/palaces/create-memory', params: { sceneId: scene.id } })
                  }
                  style={styles.sceneCard}>
                  <AppImage imageUrl={scene.imageUrl} imageSource={scene.imageSource} style={styles.sceneImage} />
                  <View style={styles.sceneShade} />
                  <View style={styles.sceneCopy}>
                    <Text numberOfLines={1} style={styles.sceneName}>
                      {scene.name}
                    </Text>
                    <Text style={styles.sceneMeta}>{scene.loci.length} {t('memorableLoci')}</Text>
                  </View>
                </AnimatedPressable>
                {!scene.isTemplate ? (
                  <AnimatedPressable
                    accessibilityLabel={t('editScene').replace('{name}', scene.name)}
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
            title={t('noScenes')}
            body={t('publishScene')}
            onAction={scenes.refetch}
          />
        )}

        <View style={styles.sectionHeadingRow}>
          <View>
            <Text style={styles.sectionEyebrow}>{t('yourJourneys')}</Text>
            <Text style={styles.sectionTitle}>{t('readyForMentalWalk')}</Text>
          </View>
        </View>

        {memorySets.isLoading ? (
          <View style={styles.memoryLoading}>
            <LoadingView description={t('finding')} />
          </View>
        ) : memorySets.isError ? (
          <ModuleNoticeCard
            title={t('doorsStuck')}
            body={getNumberPegErrorMessage(memorySets.error, t('connection'))}
            onAction={memorySets.refetch}
          />
        ) : memorySets.data?.length ? (
          memorySets.data.map((memorySet) => (
            <MemorySetRow
              key={memorySet.id}
              tone="palace"
              title={memorySet.title}
              badgeText={String(memorySet.items.length)}
              subtitle={`${memorySet.items.length} ${memorySet.items.length === 1 ? t('locusSingular') : t('lociPlural')} · ${memorySet.status === 'draft' ? t('keepPlacing') : t('walkAndRecall')}`}
              onPress={() => router.push(`/palaces/memory/${memorySet.id}` as Href)}
            />
          ))
        ) : (
          <ModuleNoticeCard
            emoji="🗺️"
            title={t('firstJourney')}
            body={t('firstJourneyBody')}
            actionLabel={t('buildAPalace')}
            actionIcon={<ChevronRight size={16} color={theme.ink} />}
            onAction={() => router.push('/palaces/create-memory' as Href)}
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
  sectionEyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 1 },
  sectionTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 17, marginTop: 3 },
  sectionHeadingCopy: { flex: 1, paddingRight: 10 },
  seeAllButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 1, borderRadius: 999, backgroundColor: '#EEE9FF', paddingLeft: 11, paddingRight: 7 },
  seeAllText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  sceneRail: { gap: 12, paddingRight: 8 },
  sceneCardWrap: { width: 112, height: 76 },
  sceneCard: {
    width: 112,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E3D7B3',
    borderWidth: 2,
    borderColor: '#EEE9DC',
  },
  sceneImage: { ...StyleSheet.absoluteFillObject },
  sceneShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(43,42,61,0.25)',
  },
  sceneCopy: { position: 'absolute', left: 7, right: 7, bottom: 6 },
  sceneEditButton: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(255,255,255,.9)', alignItems: 'center', justifyContent: 'center' },
  sceneName: { color: 'white', fontFamily: typography.displayExtraBold, fontSize: 10, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  sceneMeta: { color: 'rgba(255,255,255,0.85)', fontFamily: typography.bodyBold, fontSize: 8.5, marginTop: 1 },
  heroEmoji: { fontSize: 27 },
  sceneLoading: { height: 72, overflow: 'hidden', borderRadius: 14 },
  memoryLoading: { height: 150, overflow: 'hidden', borderRadius: 20 },
  customCard: { marginTop: 14, borderRadius: 18, borderWidth: 1.5, borderColor: '#DCD4FF', backgroundColor: '#F7F5FF', padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  customIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EEE9FF', alignItems: 'center', justifyContent: 'center' },
  customEmoji: { fontSize: 20 },
  customCopy: { flex: 1 },
  customEyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9.5, letterSpacing: 0.8 },
  customTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, marginTop: 2 },
  customBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 16, marginTop: 2 },
  customArrow: { color: theme.violetDeep, fontFamily: typography.display, fontSize: 22 },
});
