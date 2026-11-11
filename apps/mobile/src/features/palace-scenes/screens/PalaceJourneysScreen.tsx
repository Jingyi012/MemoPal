import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useMemorySets } from '@/features/memory-sets';
import { usePalaceScenes } from '@/features/palace-scenes/hooks/usePalaceScenes';
import { PalaceJourneyCard } from '@/features/palace-scenes/components/PalaceJourneyCard';
import type { PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, MapPin } from '@/core/icons';
import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

export default function PalaceJourneysScreen() {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('palace');
  const router = useRouter();
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const memorySetsQuery = useMemorySets('palace');
  const scenesQuery = usePalaceScenes();
  const journeys = useMemo(() => [...(memorySetsQuery.data ?? [])]
    .filter((item) => item.status !== 'archived')
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)), [memorySetsQuery.data]);
  const scenes = scenesQuery.data ?? [];
  const refresh = () => { void Promise.allSettled([memorySetsQuery.refetch(), scenesQuery.refetch()]); };

  return (
    <View style={styles.page}>
      <CommonHeader showAiCredits={false} title={t('yourJourneys')} backAction={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={memorySetsQuery.isRefetching || scenesQuery.isRefetching} onRefresh={refresh} />}>
        <Text style={styles.subtitle}>{t('journeyListSubtitle')}</Text>
        {!isOffline && memorySetsQuery.isLoading ? <View style={styles.loading}><LoadingView description={t('finding')} /></View> : null}
        {canShowRequestErrors && memorySetsQuery.isError ? <ModuleNoticeCard title={t('doorsStuck')} body={t('connection')} actionLabel={t('refresh')} onAction={() => void memorySetsQuery.refetch()} /> : null}
        {journeys.length ? (
          <View style={styles.list}>
            {journeys.map((memorySet) => (
              <PalaceJourneyCard
                key={memorySet.id}
                memorySet={memorySet}
                scene={findJourneyScene(memorySet.techniquePlan?.palaceSceneId, scenes)}
                onPress={() => router.push(`/palaces/memory/${memorySet.id}` as Href)}
                actionLabel={memorySet.status === 'draft' ? t('keepPlacing') : t('walkOnce')}
              />
            ))}
          </View>
        ) : !memorySetsQuery.isLoading && !memorySetsQuery.isError ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><MapPin size={22} color={theme.violetDeep} /></View>
            <Text style={styles.emptyTitle}>{t('firstJourney')}</Text>
            <Text style={styles.emptyBody}>{t('firstJourneyBody')}</Text>
            <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/palaces/create-memory' as Href)} style={styles.createButton}>
              <Text style={styles.createButtonText}>{t('buildAPalace')}</Text>
              <ArrowRight size={16} color={theme.onAccent} />
            </AnimatedPressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function findJourneyScene(sceneId: string | null | undefined, scenes: PalaceScene[]) {
  return sceneId ? scenes.find((scene) => scene.id === sceneId) : undefined;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: appSpacing.lg, paddingTop: appSpacing.sm, paddingBottom: appSpacing.section, gap: 14 },
  subtitle: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, marginBottom: 2 },
  list: { gap: 10 },
  loading: { height: 120, overflow: 'hidden' },
  empty: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.card, borderWidth: 1.5, gap: 10, padding: 22 },
  emptyIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: appRadii.card, height: 52, justifyContent: 'center', width: 52 },
  emptyTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.cardTitle.fontSize, textAlign: 'center' },
  emptyBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, textAlign: 'center' },
  createButton: { alignItems: 'center', backgroundColor: theme.violetDeep, borderBottomColor: theme.nightDeep, borderBottomWidth: 3, borderRadius: appRadii.control, flexDirection: 'row', gap: appSpacing.sm, justifyContent: 'center', marginTop: appSpacing.xs, minHeight: 48, paddingHorizontal: 18 },
  createButtonText: { color: theme.onAccent, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.caption.fontSize },
}));
