import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppButton } from '@/components/ui/AppButton';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useAuth } from '@/contexts/AuthProvider';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useTranslation } from '@/core/i18n/useTranslation';
import { usePredefinedMemoryLessons, type PredefinedMemoryLesson } from '@/features/predefined-memory-lessons';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Href, Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Check, Clock3, Sparkles } from '@/core/icons';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingMutations } from '../hooks/useOnboardingMutations';
import { getStarterLessons, localizeStarterLesson, starterMemoryParams } from '../utils/starterMemory';
import { guidedStarterSessionHref } from '../utils/onboardingRoutes';

export function OnboardingScreen() {
  const { styles, theme } = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const finished = user?.onboardingStatus === 'completed' || user?.onboardingStatus === 'skipped';
  const { language, t } = useTranslation('onboarding');
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const lessonsQuery = usePredefinedMemoryLessons();
  const { start } = useOnboardingMutations();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    user?.onboardingSelectedCategoryId ?? null
  );
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    user?.onboardingSelectedLessonId ?? null
  );
  const [chooseAnother, setChooseAnother] = useState(false);

  const starterLessons = useMemo(() => getStarterLessons(lessonsQuery.data ?? []), [lessonsQuery.data]);
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
    if (!selectedLesson || isOffline || start.isPending) return;
    try {
      await start.mutateAsync({ categoryId: selectedLesson.categoryId, lessonId: selectedLesson.id });
      router.push({ pathname: '/number-peg/build', params: starterMemoryParams(selectedLesson, language) });
    } catch {
      // Preserve the selection while the mutation error is shown below.
    }
  };
  const leave = () => { if (!start.isPending) { if (router.canGoBack()) router.back(); else router.replace('/(tabs)' as Href); } };
  const resumeMemoryId = replay !== 'true' && user?.onboardingStatus === 'in-progress' && !chooseAnother
    ? user.onboardingMemorySetId
    : null;
  const resume = Boolean(resumeMemoryId);

  if (!user) return <Redirect href="/" />;
  if (finished && replay !== 'true') return <Redirect href="/(tabs)" />;

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow={t('starterPickerTitle')}
        title={t('starterPickerHeading')}
        description={t('starterPickerBody')}
        backAction={leave}
        showAiCredits={false}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {resume ? (
          <View style={styles.resumeCard}>
            <View style={styles.resumeIcon}><Text style={styles.resumeEmoji}>🧠</Text></View>
            <Text style={styles.eyebrow}>{t('memoryReady')}</Text>
            <Text style={styles.title}>{t('finishFirstRecall')}</Text>
            <Text style={styles.body}>{t('finishFirstRecallBody')}</Text>
            <AppButton fullWidth label={t('starterContinue')} onPress={() => resumeMemoryId && router.replace(guidedStarterSessionHref(resumeMemoryId))} size="large" style={styles.primary} trailingIcon={ArrowRight} />
            <AppButton fullWidth label={t('starterGoToCourses')} onPress={() => router.replace('/discover' as Href)} size="large" />
            <AnimatedPressable accessibilityRole="button" onPress={() => setChooseAnother(true)} style={styles.textButton}>
              <Text style={styles.link}>{t('chooseAnotherLesson')}</Text>
            </AnimatedPressable>
          </View>
        ) : (
          <>
            {!isOffline && lessonsQuery.isLoading ? <LoadingView description={t('loadingLessons')} />
              : isOffline ? <Text style={styles.state}>{t('guideOffline')}</Text>
              : canShowRequestErrors && lessonsQuery.isError ? (
                <View style={styles.preview}>
                  <Text style={styles.lessonTitle}>{t('lessonsUnavailable')}</Text>
                  <Text style={styles.body}>{t('lessonsUnavailableBody')}</Text>
                  <AnimatedPressable accessibilityRole="button" onPress={() => lessonsQuery.refetch()} style={styles.textButton}>
                    <Text style={styles.link}>{t('tryAgain')}</Text>
                  </AnimatedPressable>
                </View>
              ) : !starterLessons.length ? (
                <View style={styles.preview}>
                  <Text style={styles.lessonTitle}>{t('noStarterLessons')}</Text>
                  <Text style={styles.body}>{t('noStarterLessonsBody')}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.guideStrip}>
                    <View style={styles.guideIcon}><Sparkles size={18} color={theme.berryDeep} /></View>
                    <View style={styles.guideCopy}>
                      <Text style={styles.guideTitle}>{t('pickStarter')}</Text>
                      <Text style={styles.guideBody}>{t('pickStarterBody')}</Text>
                    </View>
                  </View>
                  {categories.length > 1 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
                      {categories.map((category) => (
                        <AnimatedPressable key={category.id} accessibilityRole="button" accessibilityState={{ selected: category.id === selectedCategoryId }}
                          disabled={start.isPending} onPress={() => setSelectedCategoryId(category.id)}
                          style={[styles.chip, category.id === selectedCategoryId && styles.selectedChip]}>
                          <Text style={styles.chipText}>{category.emoji} {language === 'zh' ? category.nameZh : category.nameEn}</Text>
                        </AnimatedPressable>
                      ))}
                    </ScrollView>
                  ) : null}
                  <View style={styles.lessons}>
                    {visibleLessons.map((lesson) => {
                      const localized = localizeStarterLesson(lesson, language);
                      const selected = lesson.id === selectedLessonId;
                      return (
                        <AnimatedPressable key={lesson.id} accessibilityRole="radio" accessibilityState={{ checked: selected }}
                          disabled={start.isPending} onPress={() => setSelectedLessonId(lesson.id)} style={[styles.lesson, selected && styles.selectedLesson]}>
                          <View style={styles.lessonTopRow}>
                            <View style={[styles.lessonIcon, selected && styles.selectedLessonIcon]}>
                              <Text style={styles.emoji}>{lesson.emoji}</Text>
                            </View>
                            <View style={styles.lessonCopy}>
                              <Text style={styles.lessonTitle}>{localized.title}</Text>
                              <View style={styles.lessonMetaRow}>
                                <Text style={styles.meta}>{lesson.items.length} {t('items')}</Text>
                                <View style={styles.metaDot} />
                                <Clock3 size={12} color={theme.inkSoft} />
                                <Text style={styles.meta}>{t('threeMinutes')}</Text>
                              </View>
                            </View>
                            <View style={[styles.radio, selected && styles.selectedRadio]}>
                              {selected ? <Check size={13} color={theme.onAccent} strokeWidth={3} /> : null}
                            </View>
                          </View>
                          {selected ? (
                            <View style={styles.lessonDetails}>
                              <Text style={styles.lessonDescription}>{localized.description}</Text>
                              <View style={styles.itemChips}>
                                {localized.items.map((item, index) => (
                                  <View key={`${lesson.id}-${index}`} style={styles.itemChip}>
                                    <Text style={styles.position}>{index + 1}</Text>
                                    <Text numberOfLines={1} style={styles.itemChipText}>{item}</Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          ) : null}
                        </AnimatedPressable>
                      );
                    })}
                  </View>
                </>
              )}
            {start.isError ? <Text accessibilityRole="alert" style={styles.error}>{t('startError')}</Text> : null}
          </>
        )}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {!resume ? <AppButton
          disabled={!selectedLesson || isOffline || lessonsQuery.isError}
          fullWidth
          label={start.isPending ? t('starting') : t('starterPickerStart')}
          loading={start.isPending}
          onPress={beginLesson}
          size="large"
          style={styles.primary}
          trailingIcon={ArrowRight}
        /> : null}
        <AnimatedPressable accessibilityRole="button" disabled={start.isPending} onPress={() => router.push('/create-memory' as Href)} style={styles.textButton}>
          <Text style={styles.link}>{t('starterOwnContent')}</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 28 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.prompt.fontSize, lineHeight: appTextStyles.prompt.lineHeight },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  eyebrow: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, letterSpacing: 1, textTransform: 'uppercase' },
  guideStrip: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: appRadii.card, borderWidth: 1.5, borderColor: theme.berryLine, backgroundColor: theme.berryTint, padding: 13, marginBottom: 14 },
  guideIcon: { width: 40, height: 40, borderRadius: appRadii.control, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper },
  guideCopy: { flex: 1 },
  guideTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize },
  guideBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, marginTop: 2 },
  categories: { gap: appSpacing.sm, paddingBottom: 14 },
  chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: appRadii.card, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.paper },
  selectedChip: { backgroundColor: theme.violetTint, borderColor: theme.violetDeep },
  chipText: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize },
  lessons: { gap: 11 },
  lesson: { padding: 13, borderRadius: appRadii.card, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper },
  selectedLesson: { borderColor: theme.violetLine, backgroundColor: theme.violetTint },
  lessonTopRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  lessonIcon: { width: 48, height: 48, borderRadius: appRadii.control, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.peachTint },
  selectedLessonIcon: { backgroundColor: theme.paper },
  emoji: { fontSize: appArtworkSizes.small },
  lessonCopy: { flex: 1 },
  lessonTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.body.fontSize },
  lessonMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  meta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: theme.inkMuted, marginHorizontal: 2 },
  radio: { width: 23, height: 23, borderRadius: appRadii.control, borderWidth: 1.5, borderColor: theme.line, alignItems: 'center', justifyContent: 'center' },
  selectedRadio: { borderColor: theme.violetDeep, backgroundColor: theme.violetDeep },
  lessonDetails: { borderTopWidth: 1, borderTopColor: theme.violetLine, marginTop: 13, paddingTop: appSpacing.md },
  lessonDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  itemChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  itemChip: { maxWidth: '100%', minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, borderRadius: 10, backgroundColor: theme.paper, borderWidth: 1, borderColor: theme.violetLine },
  itemChipText: { maxWidth: 210, color: theme.ink, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize },
  preview: { padding: appSpacing.lg, borderRadius: appRadii.card, backgroundColor: theme.paper, marginTop: 10, gap: appSpacing.md },
  resumeCard: { alignItems: 'flex-start', padding: appSpacing.xl, borderRadius: appRadii.hero, borderWidth: 1.5, borderColor: theme.violetLine, backgroundColor: theme.violetTint, gap: appSpacing.sm },
  resumeIcon: { width: 54, height: 54, borderRadius: appRadii.card, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper, marginBottom: appSpacing.xs },
  resumeEmoji: { fontSize: appArtworkSizes.medium },
  position: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  state: { color: theme.inkSoft, marginVertical: appSpacing.xxl, textAlign: 'center' },
  error: { color: theme.berryDeep, fontFamily: typography.bodyBold, marginTop: appSpacing.md },
  footer: { paddingHorizontal: 18, paddingTop: appSpacing.md, borderTopWidth: 1, borderTopColor: theme.line, backgroundColor: theme.canvas },
  primary: { alignSelf: 'stretch' },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  link: { color: theme.link, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize },
}));
