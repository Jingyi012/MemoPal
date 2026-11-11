import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppButton } from '@/components/ui/AppButton';
import { CommonHeader } from '@/components/CommonHeader';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { buildAllNumberPegItems, getUnlockedPegCount } from '@/features/number-peg/utils/numberPegMap';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { localizeNumberPeg } from '@/features/number-peg/utils/localizedNumberPeg';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, Check, RefreshCcw, X } from '@/core/icons';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';

type Feedback = 'correct' | 'wrong' | null;

export default function NumberPegFamiliarityScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { t } = useTranslation('numberPeg');
  const { user } = useCurrentUser();
  const unlockedCount = getUnlockedPegCount(Math.max(1, user?.level ?? 1));
  const [started, setStarted] = useState(false);
  const [rangeStart, setRangeStart] = useState(1);
  const rangeOptions = useMemo(() => Array.from({ length: Math.ceil(unlockedCount / 10) }, (_, index) => index * 10 + 1), [unlockedCount]);
  const pegs = useMemo(() => buildAllNumberPegItems().slice(rangeStart - 1, Math.min(rangeStart + 9, unlockedCount)), [rangeStart, unlockedCount]);
  const localizedPegs = useMemo(() => pegs.map((peg) => localizeNumberPeg(peg, t)), [pegs, t]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);

  const isComplete = questionIndex >= pegs.length;
  const current = localizedPegs[questionIndex];
  const choices = useMemo(() => {
    if (!current) return [];
    const ordered = [
      current,
      localizedPegs[(questionIndex + 3) % localizedPegs.length],
      localizedPegs[(questionIndex + 6) % localizedPegs.length],
    ];
    // Shuffle each question independently, but deterministically. This keeps
    // choices stable during re-renders without creating a visible 1-2-3 cycle.
    let seed = hashChoiceSeed(`${current.id}:${questionIndex}`);
    return ordered
      .map((choice) => {
        seed = nextChoiceSeed(seed);
        return { choice, sortKey: seed };
      })
      .sort((left, right) => left.sortKey - right.sortKey)
      .map(({ choice }) => choice);
  }, [current, localizedPegs, questionIndex]);

  const choose = (pegId: string) => {
    if (feedback || !current) return;
    const isCorrect = pegId === current.id;
    setSelectedId(pegId);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore((value) => value + 1);
  };

  const next = () => {
    setQuestionIndex((value) => value + 1);
    setSelectedId(null);
    setFeedback(null);
  };

  const restart = () => {
    setQuestionIndex(0);
    setSelectedId(null);
    setFeedback(null);
    setScore(0);
    setStarted(true);
  };

  return (
    <View style={styles.page}>
      <CommonHeader showAiCredits={false}
        eyebrow={t('eyebrow')}
        title={t('anchors')}
        description={t('familiarityDescription')}
        backAction={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!started ? (
          <View style={styles.rangeCard}>
            <Text style={styles.rangeEyebrow}>{t('chooseAnchorRange')}</Text>
            <Text style={styles.rangeTitle}>{t('chooseAnchorRangeBody')}</Text>
            <View style={styles.rangeGrid}>
              {rangeOptions.map((start) => {
                const end = Math.min(start + 9, unlockedCount);
                const selected = start === rangeStart;
                const optionWidth = Math.max(120, Math.floor((windowWidth - 100) / 2));
                return <AnimatedPressable key={start} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setRangeStart(start)} style={[styles.rangeOption, { width: optionWidth }, selected && styles.rangeOptionSelected]}>
                  <Text style={[styles.rangeNumber, selected && styles.rangeNumberSelected]}>{start}–{end}</Text>
                  <Text style={[styles.rangeLabel, selected && styles.rangeLabelSelected]}>{t('anchors')}</Text>
                </AnimatedPressable>;
              })}
            </View>
            <AppButton label={t('startRange')} size="large" fullWidth trailingIcon={ArrowRight} onPress={() => setStarted(true)} style={styles.rangeStartButton} />
          </View>
        ) : isComplete ? (
          <View style={styles.completeCard}>
            <Text style={styles.completeEmoji}>{score === pegs.length ? '🎉' : '🌟'}</Text>
            <Text style={styles.completeTitle}>{t('familiarityComplete')}</Text>
            <Text style={styles.completeScore}>{score} / {pegs.length}</Text>
            <Text style={styles.completeBody}>
              {t('familiarityCompleteBody')}
            </Text>
            <View style={styles.primaryButtonWrap}>
              <AppButton label={t('buildMemory')} size="large" fullWidth trailingIcon={ArrowRight} onPress={() => router.push('/number-peg/create' as Href)} style={styles.primaryButton} />
            </View>
            <AppButton label={t('practiceAgain')} variant="secondary" size="compact" icon={RefreshCcw} onPress={restart} style={styles.secondaryButton} />
          </View>
        ) : (
          <>
            <View style={styles.tipCard}>
              <View style={styles.tipIcon}><Text style={styles.tipEmoji}>🧠</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>{t('pictureAutomatic')}</Text>
                <Text style={styles.tipBody}>{t('pictureAutomaticBody')}</Text>
              </View>
            </View>

            {pegs.length <= 20 ? (
              <View style={styles.progressRow}>
                {pegs.map((peg, index) => <View key={peg.id} style={[styles.progressDot, index < questionIndex && styles.progressDone, index === questionIndex && styles.progressCurrent]} />)}
              </View>
            ) : (
              <Text style={styles.progressCount}>{questionIndex + 1} / {pegs.length}</Text>
            )}

            <View style={styles.questionCard}>
              <View style={styles.numberBadge}><Text style={styles.numberBadgeText}>{current.number}</Text></View>
              <Text style={styles.questionEyebrow}>{t('anchorProgress').replace('{current}', String(questionIndex + 1)).replace('{total}', String(pegs.length))}</Text>
              <Text style={styles.questionTitle}>{t('whichPictureForNumber').replace('{number}', String(current.number))}</Text>
              <Text style={styles.questionHint}>{current.description}</Text>

              <View style={styles.choiceGrid}>
                {choices.map((choice) => {
                  const selected = choice.id === selectedId;
                  const isAnswer = choice.id === current.id;
                  return (
                    <View key={choice.id} style={styles.choiceWrap}>
                      <AnimatedPressable
                        onPress={() => choose(choice.id)}
                        style={[styles.choiceCard, selected && (isAnswer ? styles.choiceCorrect : styles.choiceWrong), feedback && isAnswer && styles.choiceCorrect]}>
                        <Text style={styles.choiceEmoji}>{choice.image}</Text>
                        <Text style={styles.choiceName}>{choice.keyword}</Text>
                        {selected && <View style={styles.choiceResult}>{isAnswer ? <Check size={14} color={theme.grass} /> : <X size={14} color={theme.berryDeep} />}</View>}
                      </AnimatedPressable>
                    </View>
                  );
                })}
              </View>

              {feedback && (
                <View style={styles.feedbackRow}>
                  {feedback === 'correct' ? <Check size={18} color={theme.grass} /> : <X size={18} color={theme.berryDeep} />}
                  <Text style={[styles.feedbackText, feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong]}>
                    {feedback === 'correct' ? t('pictureLocked') : t('pictureBelongsTo').replace('{keyword}', current.keyword.toLowerCase()).replace('{number}', String(current.number))}
                  </Text>
                </View>
              )}

              {feedback && (
                <View style={styles.primaryButtonWrap}>
                  <AppButton label={questionIndex === pegs.length - 1 ? t('seeMyScore') : t('nextAnchor')} size="large" fullWidth trailingIcon={ArrowRight} onPress={next} style={styles.primaryButton} />
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function hashChoiceSeed(value: string): number {
  return Array.from(value).reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
}

function nextChoiceSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: appSpacing.lg, paddingBottom: 42 },
  rangeCard: { borderRadius: 23, borderWidth: 1.5, borderColor: theme.violetLine, backgroundColor: theme.paper, padding: 18 },
  rangeEyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, letterSpacing: 1, textTransform: 'uppercase' },
  rangeTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.screenTitle.fontSize, lineHeight: appTextStyles.screenTitle.lineHeight, marginTop: 7 },
  rangeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 17 },
  rangeOption: { minHeight: 65, alignItems: 'center', justifyContent: 'center', borderRadius: appRadii.control, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.canvas, padding: 7 },
  rangeOptionSelected: { borderColor: theme.violetDeep, backgroundColor: theme.violetTint },
  rangeNumber: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.cardTitle.fontSize },
  rangeNumberSelected: { color: theme.violetDeep },
  rangeLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize, marginTop: 2 },
  rangeLabelSelected: { color: theme.violetDeep },
  rangeStartButton: { marginTop: 17 },
  tipCard: { flexDirection: 'row', gap: 11, borderRadius: appRadii.card, borderWidth: 1.5, borderColor: theme.sunLine, backgroundColor: theme.sunTint, padding: 14 },
  tipIcon: { width: 38, height: 38, borderRadius: appRadii.control, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.violetTint },
  tipEmoji: { fontSize: appArtworkSizes.tiny },
  tipTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize },
  tipBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, marginTop: 3 },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7, marginVertical: 19 },
  progressCount: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, textAlign: 'center', marginVertical: 18 },
  progressDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: theme.line },
  progressDone: { backgroundColor: theme.grass },
  progressCurrent: { backgroundColor: theme.violetDeep, transform: [{ scale: 1.25 }] },
  questionCard: { borderRadius: appRadii.card, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: appSpacing.xl, alignItems: 'center', boxShadow: '0px 4px 12px rgba(43, 42, 61, 0.08)' },
  numberBadge: { width: 58, height: 58, borderRadius: 29, backgroundColor: theme.violetDeep, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 3px 8px ${theme.violetDeep}59` },
  numberBadgeText: { color: theme.onAccent, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.prompt.fontSize },
  questionEyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, letterSpacing: 0.9, marginTop: 13 },
  questionTitle: { color: theme.ink, fontFamily: typography.display, fontSize: appTextStyles.sectionTitle.fontSize, lineHeight: appTextStyles.sectionTitle.lineHeight, textAlign: 'center', marginTop: 6 },
  questionHint: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, textAlign: 'center', marginTop: 5 },
  choiceGrid: { width: '100%', flexDirection: 'row', gap: appSpacing.sm, marginTop: 18 },
  choiceWrap: { flex: 1, minWidth: 0 },
  choiceCard: { width: '100%', minHeight: 110, borderRadius: appRadii.control, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, alignItems: 'center', justifyContent: 'center', padding: appSpacing.sm, position: 'relative' },
  choiceCorrect: { borderColor: theme.grass, backgroundColor: theme.mintTint },
  choiceWrong: { borderColor: theme.berry, backgroundColor: theme.berryTint },
  choiceEmoji: { fontSize: appArtworkSizes.large },
  choiceName: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, marginTop: 6 },
  choiceResult: { position: 'absolute', right: 6, top: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: theme.paper, alignItems: 'center', justifyContent: 'center' },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 15 },
  feedbackText: { fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, textAlign: 'center' },
  feedbackCorrect: { color: theme.grass },
  feedbackWrong: { color: theme.berryDeep },
  primaryButtonWrap: { alignSelf: 'stretch', marginTop: 17 },
  primaryButton: { alignSelf: 'stretch' },
  completeCard: { borderRadius: 23, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: appSpacing.xxl, alignItems: 'center', boxShadow: '0px 4px 12px rgba(43, 42, 61, 0.08)' },
  completeEmoji: { fontSize: appArtworkSizes.hero },
  completeTitle: { color: theme.ink, fontFamily: typography.display, fontSize: appTextStyles.screenTitle.fontSize, textAlign: 'center', marginTop: 10 },
  completeScore: { color: theme.grass, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.phrase.fontSize, marginTop: appSpacing.sm },
  completeBody: { color: theme.inkSoft, fontFamily: typography.body, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight, textAlign: 'center', marginTop: appSpacing.sm },
  secondaryButton: { alignSelf: 'center', marginTop: 9 },
}));
