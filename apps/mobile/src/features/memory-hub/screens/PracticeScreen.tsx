import { useAuth } from '@/contexts/AuthProvider';
import { SpotlightTarget } from '@/features/onboarding/components/SpotlightTourProvider';
import { practiceCreateHref } from '@/features/onboarding/utils/onboardingRoutes';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useEnabledMemoryModules } from '@/core/memory';
import { useMemorySets } from '@/features/memory-sets';
import type { MemorySet } from '@/features/memory-sets';
import { groupMemoryReviews, useDueMemoryReviews, useMemoryReviewProgress } from '@/features/practice-attempts';
import type { DueMemoryReview, MemoryReviewProgress } from '@/features/practice-attempts';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, BookOpen, Plus, RefreshCcw } from '@/core/icons';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';

type TechniqueKey = 'palace' | 'number-peg';
type IntentKey = 'words' | 'numbers' | 'list' | 'speech' | 'places';
const INTENT_LABEL: Record<IntentKey, 'intentWords' | 'intentNumbers' | 'intentList' | 'intentSpeech' | 'intentPlaces'> = {
  words: 'intentWords', numbers: 'intentNumbers', list: 'intentList', speech: 'intentSpeech', places: 'intentPlaces',
};

const INTENT_TECHNIQUE: Record<IntentKey, TechniqueKey> = {
  words: 'palace',
  numbers: 'number-peg',
  list: 'number-peg',
  speech: 'palace',
  places: 'palace',
};

export default function PracticeScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const scroll = useRef<ScrollView>(null);
  const { user: authUser } = useAuth();
  const openMemoryFlow = (requestedGuide: boolean) => {
    if (!requestedGuide) {
      router.push('/create-memory' as Href);
      return;
    }
    router.push(practiceCreateHref(
      authUser?.onboardingStatus,
      authUser?.onboardingMemorySetId,
      true,
    ) as Href);
  };
  const createMemory = () => openMemoryFlow(false);
  const revealTop = () => scroll.current?.scrollTo({ y: 0, animated: false });
  const { t } = useTranslation('practice');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const modules = useEnabledMemoryModules();
  const memorySets = useMemorySets();
  const dueReviews = useDueMemoryReviews();
  const [selectedIntent, setSelectedIntent] = useState<IntentKey | null>(null);

  const continueSet = useMemo(
    () => [...(memorySets.data ?? [])]
      .filter((memorySet) => memorySet.status !== 'archived')
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))[0],
    [memorySets.data]
  );
  const continueProgress = useMemoryReviewProgress(continueSet?.id ?? '');
  const dueGroups = useMemo(() => groupMemoryReviews(dueReviews.data ?? []), [dueReviews.data]);
  // Count the underlying memory items (not grouped review cards), matching HomeScreen.
  const dueItemCount = (dueReviews.data ?? []).length;
  const openDueReview = (review: DueMemoryReview) => {
    router.push({
      pathname: '/memory-review/[memorySetId]',
      params: { memorySetId: review.memorySetId, scope: 'due' },
    });
  };

  const dueReview = dueGroups[0]?.review;
  const continueSetHasDueReviews = Boolean(continueSet && dueGroups.some((group) => group.review.memorySetId === continueSet.id));
  const recommendedTechnique = selectedIntent ? INTENT_TECHNIQUE[selectedIntent] : null;
  const availableTechniques = new Set(modules.map((module) => module.key));
  const isPreparingFirstAction = !isOffline && (!dueReviews.isFetched || !memorySets.isFetched);

  const chooseIntent = (intent: IntentKey) => {
    setSelectedIntent(intent);
  };
  const startTechnique = (technique: TechniqueKey) => {
    const module = modules.find((candidate) => candidate.key === technique);
    if (module) router.push(module.route as Href);
  };

  return (
    <View style={styles.page}>
      <CommonHeader
        title={t('title')}
        description={t('headerSubtitle')}
        hideBackButton
        showAiCredits
      />

      <ScrollView ref={scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {canShowRequestErrors && dueReviews.isError ? (
          <ModuleNoticeCard
            icon={<RefreshCcw size={21} color={theme.inkSoft} />}
            title={t('dueReviewUnavailable')}
            body={t('dueReviewUnavailableBody')}
            actionLabel={t('tryAgain')}
            onAction={() => dueReviews.refetch()}
          />
        ) : null}

        <View style={styles.intentBlock}>
          <Text style={[styles.intentPrompt, { color: activeTheme.inkSoft }]}>{t('intentPrompt')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.intentScroller}>
            {(['words', 'numbers', 'list', 'speech', 'places'] as IntentKey[]).map((intent) => {
              const active = selectedIntent === intent;
              return (
                <AnimatedPressable
                  key={intent}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => chooseIntent(intent)}
                  style={[styles.intentChip, active && styles.intentChipActive]}>
                  <Text style={[styles.intentChipText, { color: active ? theme.onAccent : theme.ink }]}>{t(INTENT_LABEL[intent])}</Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </View>

        {continueSet && !continueSetHasDueReviews ? (
          <ContinueLearningCard
            label={t('continueLearning')}
            memorySet={continueSet}
            progress={continueProgress.data}
            actionLabel={t('practiceNow')}
            onPress={() => openMemorySet(router, continueSet)}
          />
        ) : isPreparingFirstAction ? (
          <View style={styles.preparingCard}>
            <ActivityIndicator size="small" color={activeTheme.violetDeep} />
            <Text style={[styles.preparingText, { color: activeTheme.inkSoft }]}>{t('preparingNextStep')}</Text>
          </View>
        ) : null}

        {dueReview ? (
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={`${t('dueReviewCount', { count: dueItemCount })}. ${t('startReview')}`}
            onPress={() => openDueReview(dueReview)}
            style={styles.reviewBanner}>
            <View style={styles.reviewCount}><Text style={styles.reviewCountText}>{dueItemCount}</Text></View>
            <View style={styles.reviewCopy}>
              <Text style={styles.reviewTitle}>{t('dueReviewShort')}</Text>
              <Text numberOfLines={1} style={styles.reviewBody}>{t('dueReviewBody')}</Text>
            </View>
            <View style={styles.reviewAction}>
              <Text style={styles.reviewActionText}>{t('startReview')}</Text>
              <ArrowRight size={15} color={theme.violetDeep} />
            </View>
          </AnimatedPressable>
        ) : null}

        {canShowRequestErrors && memorySets.isError && !continueSet ? (
          <ModuleNoticeCard
            icon={<RefreshCcw size={21} color={theme.inkSoft} />}
            title={t('continueUnavailable')}
            body={t('continueUnavailableBody')}
            actionLabel={t('tryAgain')}
            onAction={() => memorySets.refetch()}
          />
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: activeTheme.ink }]}>{t('chooseTechnique')}</Text>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={t('allLessons')}
            accessibilityHint={t('allLessonsBody')}
            onPress={() => router.push('/lessons' as Href)}
            style={styles.courseLink}>
            <BookOpen size={15} color={activeTheme.violetDeep} />
            <Text style={[styles.courseLinkText, { color: activeTheme.violetDeep }]}>{t('allLessons')}</Text>
            <ArrowRight size={14} color={activeTheme.violetDeep} />
          </AnimatedPressable>
        </View>

        {modules.length ? (
          <View style={styles.techniqueList}>
            {modules.map((module) => {
              const isPeg = module.key === 'number-peg';
              const key: TechniqueKey = isPeg ? 'number-peg' : 'palace';
              const recommended = recommendedTechnique === key && availableTechniques.has(key);
              return (
                <View key={module.key} style={styles.techniqueCardWrap}>
                  {recommended ? <View style={styles.recommendedBadge}><Text style={styles.recommendedText}>✦ {t('recommended')}</Text></View> : null}
                  <AnimatedPressable
                    accessibilityRole="button"
                    accessibilityHint={t('tapToStartTechnique')}
                    accessibilityLabel={isPeg ? t('numberPeg') : t('palace')}
                    onPress={() => startTechnique(key)}
                    style={styles.techniqueCard}>
                    <LinearGradient
                      colors={isPeg
                        ? [activeTheme.berryTint, activeTheme.paper]
                        : [activeTheme.violetTint, activeTheme.paper]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={[styles.techniqueOrb, { backgroundColor: isPeg ? activeTheme.berryDeep : activeTheme.violetDeep }]} />
                    <View style={styles.techniqueHeading}>
                      <View style={[styles.techniqueIcon, { backgroundColor: activeTheme.paper }]}>
                        <Text style={styles.techniqueEmoji}>{isPeg ? '🕯️' : '🏰'}</Text>
                      </View>
                      <View style={styles.techniqueTitleBlock}>
                        <Text style={[styles.techniqueName, { color: activeTheme.ink }]}>{isPeg ? t('numberPeg') : t('palace')}</Text>
                        <Text style={[styles.techniqueDescription, { color: activeTheme.inkSoft }]}>{isPeg ? t('numberPegDescription') : t('palaceDescription')}</Text>
                      </View>
                      <View style={[styles.techniqueArrow, { backgroundColor: activeTheme.paper }]}>
                        <ArrowRight size={16} color={isPeg ? activeTheme.berryDeep : activeTheme.violetDeep} />
                      </View>
                    </View>
                    <View style={styles.techniqueBottom}>
                      <View style={styles.techniqueTags}>
                      {(isPeg ? ['pegTagAnchor', 'pegTagList'] as const : ['palaceTagRoute', 'palaceTagLong'] as const)
                        .map((tag) => <View key={tag} style={styles.techniqueTag}><Text style={styles.techniqueTagText}>{t(tag)}</Text></View>)}
                      </View>
                      <TechniqueIllustration isPeg={isPeg} color={isPeg ? activeTheme.berryDeep : activeTheme.violetDeep} />
                    </View>
                  </AnimatedPressable>
                </View>
              );
            })}
          </View>
        ) : null}

        <SpotlightTarget id="practiceCreate" onReveal={revealTop} onActivate={() => openMemoryFlow(true)}>
          <AnimatedPressable accessibilityRole="button" onPress={createMemory} style={styles.createMemoryCard}>
            <View style={styles.createMemoryIcon}><Plus size={21} color={theme.onSun} /></View>
            <View style={styles.createMemoryCopy}>
              <Text style={styles.createMemoryTitle}>{t('newMemory')}</Text>
              <Text style={styles.createMemoryBody}>{t('newMemoryBody')}</Text>
            </View>
            <ArrowRight size={17} color={theme.violetDeep} />
          </AnimatedPressable>
        </SpotlightTarget>
      </ScrollView>
    </View>
  );
}

function TechniqueIllustration({ isPeg, color }: { isPeg: boolean; color: string }) {
  const { styles } = useStyles();
  if (isPeg) {
    return (
      <View style={styles.pegIllustration} accessibilityElementsHidden>
        {[1, 2, 3].map((number) => (
          <View key={number} style={[styles.pegIllustrationNode, { borderColor: color }]}>
            <Text style={[styles.pegIllustrationNumber, { color }]}>{number}</Text>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.routeIllustration} accessibilityElementsHidden>
      <View style={[styles.routeLine, { backgroundColor: color }]} />
      <View style={[styles.routeNode, styles.routeNodeStart, { borderColor: color, backgroundColor: color }]} />
      <View style={[styles.routeNode, styles.routeNodeMiddle, { borderColor: color }]} />
      <View style={[styles.routeNode, styles.routeNodeEnd, { borderColor: color, backgroundColor: color }]} />
    </View>
  );
}

function ContinueLearningCard({
  label,
  memorySet,
  progress,
  actionLabel,
  onPress,
}: {
  label: string;
  memorySet: MemorySet;
  progress?: MemoryReviewProgress | null;
  actionLabel: string;
  onPress: () => void;
}) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('practice');
  const isPalace = memorySet.techniqueKey === 'palace';
  const learnedCount = progress?.longTermItemCount ?? 0;
  const totalCount = progress?.items.length ?? memorySet.items.length;
  const progressRatio = totalCount > 0 ? Math.min(1, learnedCount / totalCount) : 0;

  return (
    <AnimatedPressable accessibilityRole="button" onPress={onPress} style={styles.continueCard}>
      <View style={[styles.continueIcon, isPalace ? styles.continuePalace : styles.continuePeg]}>
        <Text style={styles.continueEmoji}>{memorySet.emoji ?? (isPalace ? '🏰' : '🕯️')}</Text>
      </View>
      <View style={styles.continueCopy}>
        <Text style={styles.continueLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.continueTitle}>{memorySet.title}</Text>
        <Text numberOfLines={1} style={styles.continueMeta}>
          {t('learnedProgress', { learned: learnedCount, total: totalCount })} · {isPalace ? t('techniquePalace') : t('techniquePeg')}
        </Text>
        <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: totalCount, now: learnedCount }}>
          <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
        </View>
      </View>
      <View style={styles.continueAction}>
        <Text style={styles.continueActionText}>{actionLabel}</Text>
        <ArrowRight size={14} color={theme.violetDeep} />
      </View>
    </AnimatedPressable>
  );
}

function openMemorySet(router: ReturnType<typeof useRouter>, memorySet: MemorySet) {
  router.push(`/memory-details/${memorySet.id}` as Href);
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32, gap: 16 },
  intentBlock: { gap: 8 },
  intentPrompt: { fontFamily: typography.bodyExtraBold, fontSize: 12 },
  intentScroller: { gap: 8, paddingVertical: 2, paddingRight: 4 },
  intentChip: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 999, borderWidth: 1.5, justifyContent: 'center', minHeight: 40, paddingHorizontal: 14 },
  intentChipActive: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep },
  intentChipText: { fontFamily: typography.bodyExtraBold, fontSize: 12 },
  preparingCard: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 52, paddingHorizontal: 14 },
  preparingText: { fontFamily: typography.bodyBold, fontSize: 11.5 },
  reviewBanner: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.violetLine, borderLeftColor: theme.violetDeep, borderLeftWidth: 4, borderRadius: 18, borderWidth: 1.5, flexDirection: 'row', gap: 10, minHeight: 72, paddingHorizontal: 12, paddingVertical: 10 },
  reviewCount: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 14, height: 46, justifyContent: 'center', minWidth: 46, paddingHorizontal: 6 },
  reviewCountText: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: 21 },
  reviewCopy: { flex: 1, gap: 3, minWidth: 0 },
  reviewTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  reviewBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10.5 },
  reviewAction: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', gap: 5, minHeight: 44, paddingHorizontal: 11 },
  reviewActionText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10.5 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 1, minHeight: 44 },
  sectionTitle: { fontFamily: typography.displayExtraBold, fontSize: 17 },
  courseLink: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', gap: 6, minHeight: 44, paddingHorizontal: 11 },
  courseLinkText: { fontFamily: typography.bodyExtraBold, fontSize: 11 },
  techniqueList: { gap: 13 },
  techniqueCardWrap: { position: 'relative' },
  techniqueCard: { borderColor: theme.line, borderRadius: 21, borderWidth: 1.5, gap: 12, minHeight: 148, overflow: 'hidden', padding: 15 },
  techniqueOrb: { borderRadius: 48, height: 96, opacity: 0.055, position: 'absolute', right: -27, top: -40, width: 96 },
  techniqueHeading: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  techniqueIcon: { alignItems: 'center', borderRadius: 17, height: 52, justifyContent: 'center', width: 52 },
  techniqueEmoji: { fontSize: 29, lineHeight: 34 },
  techniqueTitleBlock: { flex: 1, gap: 4, minWidth: 0 },
  techniqueName: { fontFamily: typography.displayExtraBold, fontSize: 16 },
  techniqueDescription: { fontFamily: typography.bodySemibold, fontSize: 11.5, lineHeight: 17 },
  techniqueArrow: { alignItems: 'center', borderRadius: 14, height: 32, justifyContent: 'center', width: 32 },
  techniqueBottom: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 31, paddingLeft: 64 },
  techniqueTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  techniqueTag: { backgroundColor: theme.paper, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  techniqueTagText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  routeIllustration: { height: 28, position: 'relative', width: 58 },
  routeLine: { height: 2, left: 10, opacity: 0.25, position: 'absolute', right: 10, top: 13 },
  routeNode: { borderRadius: 8, borderWidth: 2, height: 12, position: 'absolute', top: 8, width: 12 },
  routeNodeStart: { left: 4 },
  routeNodeMiddle: { backgroundColor: theme.paper, height: 15, left: 22, top: 6, width: 15 },
  routeNodeEnd: { right: 4 },
  pegIllustration: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  pegIllustrationNode: { alignItems: 'center', backgroundColor: theme.paper, borderRadius: 10, borderWidth: 1.5, height: 21, justifyContent: 'center', width: 21 },
  pegIllustrationNumber: { fontFamily: typography.bodyExtraBold, fontSize: 9 },
  recommendedBadge: { alignSelf: 'flex-end', backgroundColor: theme.sun, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, position: 'absolute', right: 13, top: -9, zIndex: 1 },
  recommendedText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  createMemoryCard: { alignItems: 'center', borderColor: theme.violetLine, borderRadius: 19, borderStyle: 'dashed', borderWidth: 1.5, flexDirection: 'row', gap: 12, minHeight: 76, paddingHorizontal: 13, paddingVertical: 11 },
  createMemoryIcon: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 15, height: 44, justifyContent: 'center', width: 44 },
  createMemoryCopy: { flex: 1, gap: 3, minWidth: 0 },
  createMemoryTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 13 },
  createMemoryBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10.5, lineHeight: 15 },
  continueCard: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 82, paddingHorizontal: 10, paddingVertical: 9 },
  continueIcon: { alignItems: 'center', borderRadius: 13, height: 42, justifyContent: 'center', width: 42 },
  continuePeg: { backgroundColor: theme.berryTint },
  continuePalace: { backgroundColor: theme.violetTint },
  continueEmoji: { fontSize: 21 },
  continueCopy: { flex: 1, gap: 2, minWidth: 0 },
  continueLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9 },
  continueTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 12 },
  continueMeta: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 9 },
  progressTrack: { backgroundColor: theme.violetTint, borderRadius: 99, height: 5, marginTop: 2, overflow: 'hidden', width: '100%' },
  progressFill: { backgroundColor: theme.violetDeep, borderRadius: 99, height: '100%' },
  continueAction: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', gap: 4, minHeight: 44, paddingHorizontal: 9 },
  continueActionText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9.5 },
}));
