import AnimatedPressable from '@/components/AnimatedPressable';
import LoadingView from '@/components/LoadingView';
import { useAuth } from '@/contexts/AuthProvider';
import { useTranslation } from '@/core/i18n/useTranslation';
import {
  usePredefinedMemoryLessons,
  type PredefinedMemoryLesson,
} from '@/features/predefined-memory-lessons';
import { memopalTheme as theme, memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { Image } from 'expo-image';
import { Href, Redirect, useRouter } from 'expo-router';
import { ArrowRight, Check, Clock3, RefreshCcw } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useOnboardingMutations } from '../hooks/useOnboardingMutations';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { language, t } = useTranslation('onboarding');
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const lessonsQuery = usePredefinedMemoryLessons();
  const { start, skip } = useOnboardingMutations();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    user?.onboardingSelectedCategoryId ?? null
  );
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    user?.onboardingSelectedLessonId ?? null
  );
  const [chooseAnother, setChooseAnother] = useState(false);

  const starterLessons = useMemo(
    () =>
      (lessonsQuery.data ?? []).filter(
        (lesson) =>
          lesson.isStarterLesson &&
          lesson.techniqueKey === 'number-peg' &&
          lesson.items.length >= 2 &&
          lesson.items.length <= 5
      ),
    [lessonsQuery.data]
  );
  const categories = useMemo(() => {
    const unique = new Map<string, PredefinedMemoryLesson['category']>();
    starterLessons.forEach((lesson) => unique.set(lesson.categoryId, lesson.category));
    return [...unique.values()].sort((left, right) => left.sortOrder - right.sortOrder);
  }, [starterLessons]);
  const visibleLessons = useMemo(
    () => starterLessons.filter((lesson) => lesson.categoryId === selectedCategoryId),
    [selectedCategoryId, starterLessons]
  );
  const selectedLesson = starterLessons.find((lesson) => lesson.id === selectedLessonId) ?? null;

  useEffect(() => {
    if (!categories.length) return;
    if (!selectedCategoryId || !categories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (!visibleLessons.length) {
      setSelectedLessonId(null);
      return;
    }
    if (!selectedLessonId || !visibleLessons.some((lesson) => lesson.id === selectedLessonId)) {
      setSelectedLessonId(visibleLessons[0].id);
    }
  }, [selectedLessonId, visibleLessons]);

  const beginLesson = async () => {
    if (!selectedLesson) return;
    try {
      await start.mutateAsync({
        categoryId: selectedLesson.categoryId,
        lessonId: selectedLesson.id,
      });
      const localized = localizeLesson(selectedLesson, language);
      router.push({
        pathname: '/number-peg/build',
        params: {
          title: localized.title,
          goalType: selectedLesson.goalType,
          items: JSON.stringify(localized.items),
          onboardingLessonId: selectedLesson.id,
        },
      });
    } catch {
      // The mutation error is rendered below without losing the selected lesson.
    }
  };

  const skipGuide = async () => {
    try {
      await skip.mutateAsync();
      router.replace('/(tabs)' as Href);
    } catch {
      // Keep the guide open so the user can retry instead of bypassing server state.
    }
  };

  if (user?.onboardingStatus === 'completed' || user?.onboardingStatus === 'skipped') {
    return <Redirect href="/(tabs)" />;
  }

  if (user?.onboardingStatus === 'in-progress' && user.onboardingMemorySetId && !chooseAnother) {
    return (
      <View style={styles.page}>
        <View style={styles.resumeContent}>
          <AppLogo />
          <View style={styles.resumeHero}>
            <Text style={styles.resumeEmoji}>🧠</Text>
            <Text style={styles.resumeEyebrow}>{t('memoryReady')}</Text>
            <Text style={styles.resumeTitle}>{t('finishFirstRecall')}</Text>
            <Text style={styles.resumeBody}>{t('finishFirstRecallBody')}</Text>
            <View style={styles.resumeSteps}>
              <Text style={styles.resumeStepDone}>✓ {t('memoryBuilt')}</Text>
              <Text style={styles.resumeStepCurrent}>2 {t('recallItNow')}</Text>
              <Text style={styles.resumeStepLater}>3 {t('reviewLater')}</Text>
            </View>
          </View>
          <AnimatedPressable
            onPress={() =>
              router.push(
                `/number-peg/${user.onboardingMemorySetId}?returnTo=practice&mode=recall` as Href
              )
            }
            style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>{t('continueFirstPractice')}</Text>
            <ArrowRight size={19} color={theme.ink} strokeWidth={2.6} />
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => setChooseAnother(true)}
            style={styles.chooseAnotherButton}>
            <Text style={styles.chooseAnotherText}>{t('chooseAnotherLesson')}</Text>
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  if (!isOffline && lessonsQuery.isLoading) return <LoadingView description={t('loadingLessons')} />;

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        style={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <AppLogo />
          <AnimatedPressable
            disabled={skip.isPending}
            onPress={skipGuide}
            style={styles.skipButton}>
            <Text style={styles.skipText}>{t('skipForNow')}</Text>
          </AnimatedPressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{t('quickStart')}</Text>
          <Text style={styles.title}>{t('welcomeTitle')}</Text>
          <Text style={styles.body}>{t('welcomeBody')}</Text>
          <View style={styles.loopRow}>
            {[t('loopConnect'), t('loopRecall'), t('loopReview')].map((label, index) => (
              <View key={label} style={styles.loopItem}>
                <View style={styles.loopNumber}>
                  <Text style={styles.loopNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.loopText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {canShowRequestErrors && lessonsQuery.isError ? (
          <View style={styles.stateCard}>
            <RefreshCcw size={24} color={theme.violetDeep} />
            <Text style={styles.stateTitle}>{t('lessonsUnavailable')}</Text>
            <Text style={styles.stateBody}>{t('lessonsUnavailableBody')}</Text>
            <AnimatedPressable
              onPress={() => lessonsQuery.refetch()}
              style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>{t('tryAgain')}</Text>
            </AnimatedPressable>
          </View>
        ) : isOffline ? null : !starterLessons.length ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateEmoji}>🧩</Text>
            <Text style={styles.stateTitle}>{t('noStarterLessons')}</Text>
            <Text style={styles.stateBody}>{t('noStarterLessonsBody')}</Text>
          </View>
        ) : (
          <>
            <SectionHeading step="1" title={t('chooseGoal')} body={t('chooseGoalBody')} />
            <View style={styles.categoryGrid}>
              {categories.map((category) => {
                const active = category.id === selectedCategoryId;
                return (
                  <AnimatedPressable
                    key={category.id}
                    containerStyle={styles.categoryPressable}
                    onPress={() => setSelectedCategoryId(category.id)}
                    style={[styles.categoryCard, active && styles.categoryCardActive]}>
                    <View style={styles.categoryIcon}>
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    </View>
                    <Text style={styles.categoryName}>
                      {language === 'zh' ? category.nameZh : category.nameEn}
                    </Text>
                    {active ? (
                      <View style={styles.check}>
                        <Check size={13} color="white" strokeWidth={3} />
                      </View>
                    ) : null}
                  </AnimatedPressable>
                );
              })}
            </View>

            <SectionHeading step="2" title={t('pickStarter')} body={t('pickStarterBody')} />
            <View style={styles.lessonList}>
              {visibleLessons.map((lesson) => {
                const localized = localizeLesson(lesson, language);
                const active = lesson.id === selectedLessonId;
                return (
                  <AnimatedPressable
                    key={lesson.id}
                    onPress={() => setSelectedLessonId(lesson.id)}
                    style={[styles.lessonCard, active && styles.lessonCardActive]}>
                    <View style={styles.lessonIcon}>
                      <Text style={styles.lessonEmoji}>{lesson.emoji}</Text>
                    </View>
                    <View style={styles.lessonCopy}>
                      <Text style={styles.lessonTitle}>{localized.title}</Text>
                      <Text numberOfLines={2} style={styles.lessonDescription}>
                        {localized.description}
                      </Text>
                      <View style={styles.lessonMeta}>
                        <Text style={styles.lessonMetaText}>
                          {lesson.items.length} {t('items')}
                        </Text>
                        <Clock3 size={13} color={theme.inkSoft} />
                        <Text style={styles.lessonMetaText}>{t('threeMinutes')}</Text>
                      </View>
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active ? <View style={styles.radioDot} /> : null}
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>
          </>
        )}

        {start.isError || skip.isError ? (
          <Text style={styles.errorText}>{t('startError')}</Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <AnimatedPressable
          disabled={!selectedLesson || start.isPending}
          onPress={beginLesson}
          style={[styles.primaryAction, (!selectedLesson || start.isPending) && styles.disabled]}>
          <Text style={styles.primaryActionText}>
            {start.isPending ? t('starting') : t('startFirstMemory')}
          </Text>
          <ArrowRight size={19} color={theme.ink} strokeWidth={2.6} />
        </AnimatedPressable>
        <Text style={styles.footerHint}>{t('savedToLibrary')}</Text>
      </View>
    </View>
  );
}

function SectionHeading({ step, title, body }: { step: string; title: string; body: string }) {
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionStep}>
        <Text style={styles.sectionStepText}>{step}</Text>
      </View>
      <View style={styles.sectionCopy}>
        <Text style={[styles.sectionTitle, { color: activeTheme.ink }]}>{title}</Text>
        <Text style={[styles.sectionBody, { color: activeTheme.inkSoft }]}>{body}</Text>
      </View>
    </View>
  );
}

function AppLogo() {
  return (
    <View accessibilityLabel="MemoPal" style={styles.logo}>
      <Image
        source={require('../../../../assets/images/icon.png')}
        contentFit="cover"
        style={styles.logoImage}
      />
    </View>
  );
}

function localizeLesson(lesson: PredefinedMemoryLesson, language: 'en' | 'zh') {
  return {
    title: language === 'zh' ? lesson.titleZh : lesson.titleEn,
    description: language === 'zh' ? lesson.descriptionZh : lesson.descriptionEn,
    items: lesson.items
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((item) => (language === 'zh' ? item.contentZh : item.contentEn)),
  };
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 18, paddingBottom: 200 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden', backgroundColor: theme.ink },
  logoImage: { width: '100%', height: '100%' },
  skipButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  skipText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  hero: {
    marginTop: 20,
    borderRadius: 24,
    backgroundColor: theme.ink,
    padding: 20,
    overflow: 'hidden',
  },
  eyebrow: {
    color: theme.sun,
    fontFamily: typography.bodyExtraBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: 'white',
    fontFamily: typography.displayExtraBold,
    fontSize: 25,
    lineHeight: 31,
    marginTop: 8,
  },
  body: {
    color: '#D5D1E6',
    fontFamily: typography.bodySemibold,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },
  loopRow: { flexDirection: 'row', marginTop: 18, gap: 6 },
  loopItem: { flex: 1, minWidth: 0, alignItems: 'center', gap: 5 },
  loopNumber: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,201,60,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,201,60,0.45)',
  },
  loopNumberText: { color: theme.sun, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  loopText: {
    color: 'white',
    fontFamily: typography.bodyBold,
    fontSize: 10.5,
    textAlign: 'center',
  },
  sectionHeading: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 24,
    marginBottom: 11,
  },
  sectionStep: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.violetDeep,
  },
  sectionStepText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 12 },
  sectionCopy: { flex: 1 },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 16 },
  sectionBody: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: 11.5,
    marginTop: 2,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  categoryPressable: { width: '100%' },
  categoryCard: {
    alignItems: 'center',
    flexDirection: 'row',
    position: 'relative',
    width: '100%',
    height: 76,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryCardActive: { borderColor: theme.violetDeep, backgroundColor: '#F5F2FF' },
  categoryIcon: {
    alignItems: 'center',
    backgroundColor: '#FFF4D6',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  categoryEmoji: { fontSize: 25, lineHeight: 30 },
  categoryName: {
    flex: 1,
    minWidth: 0,
    color: theme.ink,
    fontFamily: typography.bodyExtraBold,
    fontSize: 12.5,
    lineHeight: 17,
    marginLeft: 12,
    paddingRight: 25,
  },
  check: {
    position: 'absolute',
    right: 9,
    top: 9,
    width: 21,
    height: 21,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.violetDeep,
  },
  lessonList: { gap: 9 },
  lessonCard: {
    minHeight: 105,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    padding: 12,
  },
  lessonCardActive: { borderColor: theme.sunDeep, backgroundColor: '#FFF9E9' },
  lessonIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F4',
  },
  lessonEmoji: { fontSize: 26 },
  lessonCopy: { flex: 1, minWidth: 0 },
  lessonTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14 },
  lessonDescription: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 3,
  },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  lessonMetaText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D8D4C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: theme.sunDeep },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.sunDeep },
  stateCard: {
    marginTop: 24,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    padding: 20,
    alignItems: 'center',
  },
  stateEmoji: { fontSize: 30 },
  stateTitle: {
    color: theme.ink,
    fontFamily: typography.displayExtraBold,
    fontSize: 15,
    marginTop: 8,
  },
  stateBody: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },
  secondaryAction: {
    minHeight: 42,
    borderRadius: 13,
    backgroundColor: '#EEE9FF',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  secondaryActionText: {
    color: theme.violetDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 12,
  },
  errorText: {
    color: theme.berryDeep,
    fontFamily: typography.bodyBold,
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 14,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: theme.line,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  },
  primaryAction: {
    minHeight: 52,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.sun,
  },
  primaryActionText: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14 },
  footerHint: {
    color: theme.inkSoft,
    fontFamily: typography.bodyBold,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 7,
  },
  disabled: { opacity: 0.42 },
  resumeContent: { flex: 1, paddingHorizontal: 18, paddingTop: 18, justifyContent: 'center' },
  resumeHero: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#DED7FF',
    backgroundColor: '#F8F6FF',
    padding: 22,
    marginTop: 22,
    marginBottom: 18,
  },
  resumeEmoji: { fontSize: 38 },
  resumeEyebrow: {
    color: theme.violetDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginTop: 12,
  },
  resumeTitle: {
    color: theme.ink,
    fontFamily: typography.displayExtraBold,
    fontSize: 23,
    lineHeight: 29,
    marginTop: 5,
  },
  resumeBody: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: 7,
  },
  resumeSteps: { gap: 9, marginTop: 18 },
  resumeStepDone: { color: theme.grass, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  resumeStepCurrent: {
    color: theme.ink,
    fontFamily: typography.bodyExtraBold,
    fontSize: 12,
    backgroundColor: '#FFF2C8',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  resumeStepLater: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
  chooseAnotherButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7,
  },
  chooseAnotherText: {
    color: theme.violetDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 12,
  },
});
