import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useMemorySets } from '@/features/memory-sets';
import type { MemorySet } from '@/features/memory-sets';
import { usePalaceScenes } from '@/features/palace-scenes/hooks/usePalaceScenes';
import type { PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';
import { PalaceJourneyCard } from '@/features/palace-scenes/components/PalaceJourneyCard';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { Camera, ChevronRight, MapPin } from '@/core/icons';
import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

export default function PalaceHomeScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { t } = useTranslation('palace');
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const memorySetsQuery = useMemorySets('palace');
  const scenesQuery = usePalaceScenes();
  const memorySets = useMemo(
    () => [...(memorySetsQuery.data ?? [])]
      .filter((memorySet) => memorySet.status !== 'archived')
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)),
    [memorySetsQuery.data]
  );
  const latestJourney = memorySets[0];
  const scenes = scenesQuery.data ?? [];
  const isRefreshing = memorySetsQuery.isRefetching || scenesQuery.isRefetching;
  const refresh = () => { void Promise.allSettled([memorySetsQuery.refetch(), scenesQuery.refetch()]); };
  const openJourney = (memorySet: MemorySet) => router.push(`/palaces/memory/${memorySet.id}` as Href);

  return (
    <View style={styles.page}>
      <CommonHeader showAiCredits={false} title={t('title')} backAction={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}>
        {latestJourney ? (
          <View style={styles.featuredWrap}>
            <PalaceJourneyCard
              memorySet={latestJourney}
              scene={findJourneyScene(latestJourney, scenes)}
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

        <SectionHeading
          title={t('yourJourneys')}
          count={memorySets.length ? t('palaceCount', { count: memorySets.length }) : undefined}
        />
        {memorySets.length ? (
          <View style={styles.journeyList}>
            {memorySets.slice(latestJourney ? 1 : 0, latestJourney ? 3 : 2).map((memorySet) => (
              <PalaceJourneyCard
                key={memorySet.id}
                memorySet={memorySet}
                scene={findJourneyScene(memorySet, scenes)}
                onPress={() => openJourney(memorySet)}
                actionLabel={memorySet.status === 'draft' ? t('keepPlacing') : t('walkOnce')}
              />
            ))}
            {memorySets.length > (latestJourney ? 3 : 2) ? (
              <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/palaces/journeys' as Href)} style={styles.viewAllJourneys}>
                <Text style={styles.viewAllText}>{t('viewAllJourneys', { count: memorySets.length })}</Text>
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
            accessibilityLabel={t('chooseFromLibrary')}
            onPress={() => router.push('/palaces/map' as Href)}
            style={[styles.createOption, styles.libraryOption]}>
            <View style={styles.optionIcon}><MapPin size={22} color={theme.violetDeep} /></View>
            <Text style={styles.optionTitle}>{t('chooseFromLibrary')}</Text>
            <Text style={styles.optionBody}>{t('noPhotoNeeded')}</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionHeading({ title, count }: { title: string; count?: string }) {
  const { styles } = useStyles();
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count ? <Text style={styles.sectionCount}>{count}</Text> : null}
    </View>
  );
}

function findJourneyScene(memorySet: MemorySet, scenes: PalaceScene[]) {
  const sceneId = memorySet.techniquePlan?.palaceSceneId;
  return sceneId ? scenes.find((scene) => scene.id === sceneId) : undefined;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: appSpacing.lg, paddingTop: appSpacing.sm, paddingBottom: appSpacing.section, gap: 14 },
  featuredWrap: { marginTop: 2 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: appSpacing.sm, minHeight: 32 },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize },
  sectionCount: { color: theme.violetDeep, backgroundColor: theme.violetTint, borderRadius: appRadii.pill, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5 },
  journeyList: { gap: 9 },
  viewAllJourneys: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', minHeight: 44, paddingHorizontal: 6 },
  viewAllText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  emptyJourney: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.card, borderWidth: 1, flexDirection: 'row', gap: 11, minHeight: 72, padding: appSpacing.md },
  emptyJourneyIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: appRadii.control, height: 42, justifyContent: 'center', width: 42 },
  emptyJourneyCopy: { flex: 1, gap: 3 },
  emptyJourneyTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  emptyJourneyBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  createOptions: { flexDirection: 'row', gap: 11 },
  createOptionWrap: { flex: 1, position: 'relative' },
  createOption: { borderColor: theme.violetLine, borderRadius: appRadii.card, borderWidth: 1.5, flex: 1, minHeight: 136, padding: appSpacing.md },
  personalOption: { backgroundColor: theme.paper },
  libraryOption: { backgroundColor: theme.paper },
  optionIcon: { alignItems: 'center', backgroundColor: theme.paper, borderRadius: appRadii.control, height: 38, justifyContent: 'center', marginBottom: appSpacing.sm, width: 38 },
  optionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.caption.fontSize },
  optionBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, marginTop: appSpacing.xs },
  bestBadge: { backgroundColor: theme.sun, borderRadius: appRadii.pill, paddingHorizontal: appSpacing.sm, paddingVertical: appSpacing.xs, position: 'absolute', right: 8, top: -9, zIndex: 1 },
  bestBadgeText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  loadingCard: { height: 100, overflow: 'hidden' },
}));
