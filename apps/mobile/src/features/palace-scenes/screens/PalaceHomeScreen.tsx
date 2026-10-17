import { AppImage } from '@/components/AppImage';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useMemorySets } from '@/features/memory-sets';
import type { MemorySet } from '@/features/memory-sets';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { usePalaceScenes } from '@/features/palace-scenes/hooks/usePalaceScenes';
import { isPalaceSceneUnlocked } from '@/features/palace-scenes/utils/palaceCapacity';
import type { PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';
import { getPalaceSceneName } from '@/features/palace-scenes/utils/palaceLocalization';
import { PalaceJourneyCard } from '@/features/palace-scenes/components/PalaceJourneyCard';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Camera, Check, ChevronRight, LockKeyhole, MapPin } from '@/core/icons';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SceneCategory = 'all' | 'home' | 'work' | 'outdoor';
const CATEGORY_LABEL: Record<SceneCategory, 'allScenes' | 'homeScenes' | 'workScenes' | 'outdoorScenes'> = {
  all: 'allScenes', home: 'homeScenes', work: 'workScenes', outdoor: 'outdoorScenes',
};

export default function PalaceHomeScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { t, language } = useTranslation('palace');
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const memorySetsQuery = useMemorySets('palace');
  const scenesQuery = usePalaceScenes();
  const { user } = useCurrentUser();
  const insets = useSafeAreaInsets();
  const pageScrollRef = useRef<ScrollView>(null);
  const [sceneLibraryY, setSceneLibraryY] = useState(0);
  const [category, setCategory] = useState<SceneCategory>('all');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const currentLevel = Math.max(1, user?.level ?? 1);
  const isPremium = Boolean(user?.isPremium);
  const memorySets = useMemo(
    () => [...(memorySetsQuery.data ?? [])]
      .filter((memorySet) => memorySet.status !== 'archived')
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)),
    [memorySetsQuery.data]
  );
  const journeys = memorySets;
  const latestJourney = journeys[0];
  const templateScenes = useMemo(
    () => (scenesQuery.data ?? []).filter((scene) => scene.isTemplate && scene.status === 'published'),
    [scenesQuery.data]
  );
  const filteredScenes = useMemo(
    () => templateScenes.filter((scene) => category === 'all' || getSceneCategory(scene) === category),
    [category, templateScenes]
  );
  const sceneRows = useMemo(() => {
    const rows: PalaceScene[][] = [];
    for (let index = 0; index < filteredScenes.length; index += 2) rows.push(filteredScenes.slice(index, index + 2));
    return rows;
  }, [filteredScenes]);
  const selectedScene = templateScenes.find((scene) => scene.id === selectedSceneId);
  const isRefreshing = memorySetsQuery.isRefetching || scenesQuery.isRefetching;
  const refresh = () => { void Promise.allSettled([memorySetsQuery.refetch(), scenesQuery.refetch()]); };
  const openJourney = (memorySet: MemorySet) => router.push(`/palaces/memory/${memorySet.id}` as Href);
  const openSelectedScene = () => {
    if (selectedScene) router.push({ pathname: '/palaces/create-memory', params: { sceneId: selectedScene.id } });
  };

  return (
    <View style={styles.page}>
      <CommonHeader title={t('title')} backAction={() => router.back()} />
      <ScrollView
        ref={pageScrollRef}
        contentContainerStyle={[styles.content, selectedScene && styles.contentWithDock]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}>

        {latestJourney ? (
          <View style={styles.featuredWrap}>
            <PalaceJourneyCard
              memorySet={latestJourney}
              scene={findJourneyScene(latestJourney, scenesQuery.data ?? [])}
              featured
              onPress={() => openJourney(latestJourney)}
              actionLabel={latestJourney.status === 'draft' ? t('keepPlacing') : t('walkOnce')}
            />
          </View>
        ) : !isOffline && memorySetsQuery.isLoading ? (
          <View style={styles.loadingCard}><LoadingView description={t('finding')} /></View>
        ) : canShowRequestErrors && memorySetsQuery.isError ? (
          <ModuleNoticeCard title={t('doorsStuck')} body={t('connection')} actionLabel={t('refresh')} onAction={() => void memorySetsQuery.refetch()} />
        ) : null}

        {journeys.length > 1 ? <SectionHeading title={t('yourJourneys')} count={t('palaceCount', { count: journeys.length })} /> : journeys.length === 0 ? <SectionHeading title={t('yourJourneys')} /> : null}
        {journeys.length ? (
          <View style={styles.journeyList}>
            {journeys.slice(1, 3).map((memorySet) => (
              <PalaceJourneyCard
                key={memorySet.id}
                memorySet={memorySet}
                scene={findJourneyScene(memorySet, scenesQuery.data ?? [])}
                onPress={() => openJourney(memorySet)}
                actionLabel={memorySet.status === 'draft' ? t('keepPlacing') : t('walkOnce')}
              />
            ))}
            {journeys.length > 3 ? (
              <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/palaces/journeys' as Href)} style={styles.viewAllJourneys}>
                <Text style={styles.viewAllText}>{t('viewAllJourneys', { count: journeys.length })}</Text>
                <ChevronRight size={16} color={theme.violetDeep} />
              </AnimatedPressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyJourney}>
            <View style={styles.emptyJourneyIcon}><MapPin size={20} color={theme.violetDeep} /></View>
            <View style={styles.emptyJourneyCopy}>
              <Text style={styles.emptyJourneyTitle}>{t('firstJourney')}</Text>
              <Text style={styles.emptyJourneyBody}>{t('firstJourneyBody')}</Text>
            </View>
          </View>
        )}

        <SectionHeading title={t('newPalace')} />
        <View style={styles.createOptions}>
          <View style={styles.createOptionWrap}>
            <View style={styles.bestBadge}><Text style={styles.bestBadgeText}>✦ {t('mostEffective')}</Text></View>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={t('useYourOwnPlace')}
              onPress={() => router.push('/palaces/create-custom' as Href)}
              style={[styles.createOption, styles.personalOption]}>
              <View style={styles.optionIcon}><Camera size={22} color={theme.violetDeep} /></View>
              <Text style={styles.optionTitle}>{t('useYourOwnPlace')}</Text>
              <Text style={styles.optionBody}>{t('uploadFamiliarPhoto')}</Text>
            </AnimatedPressable>
          </View>
          <AnimatedPressable
            accessibilityRole="button"
            onPress={() => pageScrollRef.current?.scrollTo({ y: Math.max(sceneLibraryY - 8, 0), animated: true })}
            style={[styles.createOption, styles.libraryOption]}>
            <View style={styles.optionIcon}><MapPin size={22} color={theme.violetDeep} /></View>
            <Text style={styles.optionTitle}>{t('chooseFromLibrary')}</Text>
            <Text style={styles.optionBody}>{t('noPhotoNeeded')}</Text>
          </AnimatedPressable>
        </View>

        <View onLayout={(event) => setSceneLibraryY(event.nativeEvent.layout.y)}>
          <SectionHeading title={t('palaceScenes')} subtitle={t('sceneLibraryHint')} />
        </View>

        {!isOffline && scenesQuery.isLoading ? (
          <View style={styles.sceneLoading}><ActivityIndicator color={theme.violetDeep} /></View>
        ) : canShowRequestErrors && scenesQuery.isError ? (
          <ModuleNoticeCard title={t('doorsStuck')} body={t('connection')} actionLabel={t('refresh')} onAction={() => void scenesQuery.refetch()} />
        ) : templateScenes.length ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
              {(['all', 'home', 'work', 'outdoor'] as SceneCategory[]).map((key) => {
                const active = category === key;
                return (
                  <AnimatedPressable key={key} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setCategory(key)} style={[styles.categoryChip, active && styles.categoryChipActive]}>
                    <Text style={[styles.categoryText, { color: active ? theme.onAccent : theme.ink }]}>{t(CATEGORY_LABEL[key])}</Text>
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
            {filteredScenes.length ? (
              <View style={styles.sceneGrid}>
                {sceneRows.map((row, rowIndex) => (
                  <View key={`scene-row-${rowIndex}`} style={styles.sceneGridRow}>
                    {row.map((scene) => (
                      <SceneCard
                        key={scene.id}
                        scene={scene}
                        name={getPalaceSceneName(scene, language)}
                        selected={selectedSceneId === scene.id}
                        locked={!isPalaceSceneUnlocked(scene, currentLevel, isPremium)}
                        onPress={() => {
                          if (!isPalaceSceneUnlocked(scene, currentLevel, isPremium)) return;
                          setSelectedSceneId((current) => current === scene.id ? null : scene.id);
                        }}
                        unlockLabel={t('unlockAtLevel').replace('{level}', String(scene.unlockLevel ?? 1))}
                        lociLabel={t('memorableLoci')}
                      />
                    ))}
                    {row.length === 1 ? <View style={styles.sceneGridSpacer} /> : null}
                  </View>
                ))}
              </View>
            ) : <Text style={styles.noCategoryScenes}>{t('noScenesInCategory')}</Text>}
          </>
        ) : (
          <ModuleNoticeCard title={t('noScenes')} body={t('publishScene')} />
        )}
      </ScrollView>

      {selectedScene ? (
        <View style={[styles.bottomDock, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <AnimatedPressable accessibilityRole="button" onPress={openSelectedScene} style={styles.createSelectedButton}>
            <Text numberOfLines={1} style={styles.createSelectedText}>{t('createWithScene', { name: getPalaceSceneName(selectedScene, language) })}</Text>
            <ArrowRight size={18} color={theme.onAccent} />
          </AnimatedPressable>
        </View>
      ) : null}
    </View>
  );
}

function SectionHeading({ title, subtitle, count }: { title: string; subtitle?: string; count?: string }) {
  const { styles } = useStyles();
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionTitleWrap}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {count ? <Text style={styles.sectionCount}>{count}</Text> : null}
    </View>
  );
}

function SceneCard({
  scene,
  name,
  selected,
  locked,
  onPress,
  unlockLabel,
  lociLabel,
}: {
  scene: PalaceScene;
  name: string;
  selected: boolean;
  locked: boolean;
  onPress: () => void;
  unlockLabel: string;
  lociLabel: string;
}) {
  const { styles, theme } = useStyles();
  return (
    <AnimatedPressable accessibilityRole="button" accessibilityState={{ selected, disabled: locked }} onPress={onPress} style={[styles.sceneCard, selected && styles.sceneCardSelected, locked && styles.sceneCardLocked]}>
      <AppImage imageUrl={scene.imageUrl} imageSource={scene.imageSource} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(24,15,55,0.02)', 'rgba(24,15,55,0.1)', 'rgba(24,15,55,0.84)']} locations={[0, 0.42, 1]} style={StyleSheet.absoluteFill} />
      {locked ? <View style={styles.lockBadge}><LockKeyhole size={12} color="#FFFFFF" /><Text style={styles.lockText}>{unlockLabel}</Text></View> : null}
      {selected ? <View style={styles.sceneCheck}><Check size={15} color={theme.onSun} strokeWidth={3} /></View> : null}
      <View style={styles.sceneInfo}>
        <Text numberOfLines={2} style={styles.sceneName}>{name}</Text>
        <Text style={styles.sceneMeta}>{scene.loci.length} {lociLabel}</Text>
      </View>
    </AnimatedPressable>
  );
}

function findJourneyScene(memorySet: MemorySet, scenes: PalaceScene[]) {
  const sceneId = memorySet.techniquePlan?.palaceSceneId;
  return sceneId ? scenes.find((scene) => scene.id === sceneId) : undefined;
}

function getSceneCategory(scene: PalaceScene): Exclude<SceneCategory, 'all'> | null {
  const text = `${scene.name} ${scene.description}`.toLocaleLowerCase();
  if (/garden|backyard|park|trail|street|outdoor|patio|beach|forest|花园|后院|公园|户外|街道|海边|森林|露台/.test(text)) return 'outdoor';
  if (/office|workshop|work|classroom|school|studio|desk|办公室|工作室|教室|学校|书房|工作/.test(text)) return 'work';
  if (/home|house|foyer|entry|living|dining|kitchen|pantry|laundry|utility|bedroom|room|家|房|玄关|客厅|餐厅|厨房|储藏|洗衣|卧室/.test(text)) return 'home';
  const id = scene.id.toLocaleLowerCase();
  if (/garden|backyard|park|trail|street|outdoor|patio|beach|forest/.test(id)) return 'outdoor';
  if (/office|workshop|work|classroom|school|studio|desk/.test(id)) return 'work';
  if (/home|house|foyer|entry|living|dining|kitchen|pantry|laundry|utility|bedroom|room/.test(id)) return 'home';
  return null;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 16 },
  contentWithDock: { paddingBottom: 120 },
  featuredWrap: { marginTop: 2 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, minHeight: 32 },
  sectionTitleWrap: { flex: 1, gap: 2 },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 17 },
  sectionSubtitle: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10.5 },
  sectionCount: { color: theme.violetDeep, backgroundColor: theme.violetTint, borderRadius: 999, fontFamily: typography.bodyExtraBold, fontSize: 10.5, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5 },
  journeyList: { gap: 9 },
  viewAllJourneys: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', minHeight: 44, paddingHorizontal: 6 },
  viewAllText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  emptyJourney: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 11, minHeight: 72, padding: 12 },
  emptyJourneyIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 14, height: 42, justifyContent: 'center', width: 42 },
  emptyJourneyCopy: { flex: 1, gap: 3 },
  emptyJourneyTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  emptyJourneyBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10.5, lineHeight: 15 },
  createOptions: { flexDirection: 'row', gap: 11 },
  createOptionWrap: { flex: 1, position: 'relative' },
  createOption: { borderColor: theme.violetLine, borderRadius: 18, borderStyle: 'dashed', borderWidth: 1.5, flex: 1, minHeight: 142, padding: 12 },
  personalOption: { backgroundColor: theme.violetTint },
  libraryOption: { backgroundColor: theme.paper },
  optionIcon: { alignItems: 'center', backgroundColor: theme.paper, borderRadius: 13, height: 38, justifyContent: 'center', marginBottom: 8, width: 38 },
  optionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 12 },
  optionBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, lineHeight: 14, marginTop: 4 },
  bestBadge: { backgroundColor: theme.sun, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, position: 'absolute', right: 8, top: -9, zIndex: 1 },
  bestBadgeText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 9 },
  categoryRail: { gap: 8, paddingVertical: 4, paddingRight: 3 },
  categoryChip: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 999, borderWidth: 1.5, justifyContent: 'center', minHeight: 38, paddingHorizontal: 14 },
  categoryChipActive: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep },
  categoryText: { fontFamily: typography.bodyExtraBold, fontSize: 11 },
  sceneGrid: { gap: 11 },
  sceneGridRow: { flexDirection: 'row', gap: 11 },
  sceneGridSpacer: { flex: 1 },
  sceneCard: { backgroundColor: theme.violetTint, borderColor: 'transparent', borderRadius: 19, borderWidth: 3, flex: 1, height: 148, overflow: 'hidden' },
  sceneCardSelected: { borderColor: theme.sun },
  sceneCardLocked: { opacity: 0.75 },
  sceneInfo: { bottom: 0, left: 0, paddingBottom: 10, paddingHorizontal: 10, paddingTop: 30, position: 'absolute', right: 0 },
  sceneName: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 13, lineHeight: 18 },
  sceneMeta: { color: 'rgba(255,255,255,0.88)', fontFamily: typography.bodyBold, fontSize: 10, marginTop: 2 },
  sceneCheck: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 14, height: 28, justifyContent: 'center', position: 'absolute', right: 8, top: 8, width: 28 },
  lockBadge: { alignItems: 'center', backgroundColor: 'rgba(35,29,54,0.75)', borderRadius: 999, flexDirection: 'row', gap: 4, left: 7, paddingHorizontal: 7, paddingVertical: 5, position: 'absolute', top: 7 },
  lockText: { color: '#FFFFFF', fontFamily: typography.bodyExtraBold, fontSize: 8.5 },
  noCategoryScenes: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, paddingVertical: 18, textAlign: 'center' },
  loadingCard: { height: 100, overflow: 'hidden' },
  sceneLoading: { alignItems: 'center', height: 160, justifyContent: 'center' },
  bottomDock: { backgroundColor: theme.canvas, borderTopColor: theme.line, borderTopWidth: 1, bottom: 0, left: 0, paddingHorizontal: 20, paddingTop: 10, position: 'absolute', right: 0 },
  createSelectedButton: { alignItems: 'center', backgroundColor: theme.violetDeep, borderBottomColor: theme.nightDeep, borderBottomWidth: 3, borderRadius: 16, flexDirection: 'row', gap: 9, justifyContent: 'center', minHeight: 50, paddingHorizontal: 14 },
  createSelectedText: { color: theme.onAccent, flexShrink: 1, fontFamily: typography.displayExtraBold, fontSize: 13.5 },
}));
