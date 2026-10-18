import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ArrowRight, CheckCircle2, Clock3, Coins, Sparkles, X } from '@/core/icons';
import { translations } from '@/core/i18n/i18n';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useRouter } from 'expo-router';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import type { LeaderboardRewardConfig, LeaderboardRewardResult } from '../api/communityLeaderboard.api';

type LibraryTranslationKey = keyof typeof translations.en.library;
type LibraryTranslator = (key: LibraryTranslationKey, values?: Record<string, string | number>) => string;

type Props = Readonly<{
  rewards?: LeaderboardRewardConfig;
  currentWeekStartsAtUtc: string;
  latestReward?: LeaderboardRewardResult | null;
  isStale?: boolean;
  lastUpdatedAt?: number;
}>;

export function LeaderboardRewardPanel({
  rewards,
  currentWeekStartsAtUtc,
  latestReward,
  isStale = false,
  lastUpdatedAt,
}: Props) {
  const { t, language } = useTranslation('library');
  const { styles, theme } = useStyles();
  const router = useRouter();
  const [rulesOpen, setRulesOpen] = useState(false);
  const hasPreviousReward = Boolean(latestReward && Date.parse(latestReward.weekStartsAtUtc) < Date.parse(currentWeekStartsAtUtc));
  const rewardsEnabled = rewards?.enabled === true;
  const minimumDays = rewards?.minimumActiveDays ?? 3;
  const tiers = [...(rewards?.tiers ?? [])].sort((a, b) => a.rankFrom - b.rankFrom);

  if (!rewards && !hasPreviousReward) return null;

  return <>
    {rewards ? <Pressable
      accessibilityRole={rewardsEnabled ? 'button' : undefined}
      accessibilityLabel={`${t('leaderboardRewardsTitle')}, ${(rewards.weeklyBudget ?? 0).toLocaleString()} ${t('leaderboardRewardsCreditUnit')}, ${t('leaderboardRewardsTop100')}`}
      accessibilityHint={rewardsEnabled ? t('leaderboardRewardsViewRules') : undefined}
      disabled={!rewardsEnabled}
      onPress={() => setRulesOpen(true)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.cardSurface}>
        {rewardsEnabled ? <>
          <View style={styles.rewardHeader}>
            <Text numberOfLines={1} style={styles.rewardTitle}>{t('leaderboardRewardsTitle')}</Text>
            <View style={styles.top100}><Sparkles size={11} color={theme.violetDeep} /><Text style={styles.top100Text}>{t('leaderboardRewardsTop100')}</Text></View>
            <ArrowRight size={14} color={theme.violetDeep} />
          </View>
          <View style={styles.poolShowcase}>
            <View style={styles.poolCopy}>
              <Text style={styles.poolLabel}>{t('leaderboardRewardsPool')}</Text>
              <View style={styles.poolLine}>
                <Text style={styles.poolAmount}>{(rewards.weeklyBudget ?? 0).toLocaleString()}</Text>
                <Text style={styles.poolUnit}>{t('leaderboardRewardsCreditUnit')}</Text>
              </View>
            </View>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.coinArtwork}>
              <View style={styles.coinDisc}><Coins size={21} color={theme.onSun} /></View>
              <View style={styles.coinSparkle}><Sparkles size={11} color={theme.sunDeep} /></View>
            </View>
          </View>
        </> : <View style={styles.disabledHeader}>
          <View style={styles.disabledIcon}><Coins size={17} color={theme.inkMuted} /></View>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>{t('leaderboardRewardsTitle')}</Text>
            <Text style={styles.subtitle}>{t('leaderboardRewardsHistorySubtitle')}</Text>
          </View>
        </View>}

        {!rewardsEnabled ? <View style={styles.disabledNotice}>
          <Text style={styles.disabledText}>{t('leaderboardRewardsDisabled')}</Text>
        </View> : null}
      </View>
    </Pressable> : null}

    {hasPreviousReward && latestReward ? <PreviousRewardResult
      reward={latestReward}
      language={language}
      t={t}
      isStale={isStale}
      lastUpdatedAt={lastUpdatedAt}
      onOpenWallet={() => router.push('/ai-credits')} /> : null}

    <Modal
      transparent
      visible={rulesOpen}
      animationType="slide"
      accessibilityViewIsModal
      onRequestClose={() => setRulesOpen(false)}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('leaderboardRewardsCloseRules')} onPress={() => setRulesOpen(false)} style={styles.modalBackdrop} />
        <View style={styles.rulesSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleGroup}>
              <View style={styles.sheetIcon}><Coins size={18} color={theme.sunDeep} /></View>
              <Text style={styles.sheetTitle}>{t('leaderboardRewardsRulesTitle')}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={t('leaderboardRewardsCloseRules')} onPress={() => setRulesOpen(false)} style={styles.closeButton}>
              <X size={19} color={theme.inkSoft} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.rulesContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.rulesIntro}>{t('leaderboardRewardsEligibility', {
              days: minimumDays,
              expiryDays: rewards?.expiryDays ?? 90,
            })}</Text>
            {tiers.map((tier) => <View key={`${tier.rankFrom}-${tier.rankTo}`} style={styles.tierRow}>
              <Text style={styles.tierRank}>{tier.rankFrom === tier.rankTo ? `#${tier.rankFrom}` : `#${tier.rankFrom}–${tier.rankTo}`}</Text>
              <Text style={styles.tierCredits}>{tier.creditsPerWinner.toLocaleString()} {t('leaderboardRewardsCreditUnit')}</Text>
            </View>)}
            <Text style={styles.rulesFootnote}>{t('leaderboardRewardsPayoutAutomatic')}</Text>
            <Text style={styles.rulesFootnote}>{t('leaderboardRewardsEstimateDisclaimer')}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}

type PreviousRewardProps = Readonly<{
  reward: LeaderboardRewardResult;
  language: string;
  t: LibraryTranslator;
  isStale: boolean;
  lastUpdatedAt?: number;
  onOpenWallet: () => void;
}>;

function PreviousRewardResult({ reward, language, t, isStale, lastUpdatedAt, onOpenWallet }: PreviousRewardProps) {
  const { styles, theme } = useStyles();
  const isSettled = reward.seasonStatus === 'settled';
  const isAwarded = isSettled && reward.status === 'awarded';
  const isRetrying = reward.status === 'failed';
  const isProcessing = reward.status === 'pending' || (!isSettled && reward.seasonStatus === 'settling');
  const isWaitingForReview = !isSettled && !isRetrying && !isProcessing;
  const stateLabel = isAwarded
    ? t('leaderboardRewardsAwarded')
    : isRetrying
      ? t('leaderboardRewardsFailed')
      : isProcessing
        ? t('leaderboardRewardsPending')
        : isWaitingForReview
          ? t('leaderboardRewardsReviewWindow')
          : reward.status === 'not-eligible'
            ? t('leaderboardRewardsNotEligible')
            : reward.status === 'outside-reward-ranks'
              ? t('leaderboardRewardsOutsideRanks')
              : reward.status === 'no-reward' && !reward.rewardsEnabled
                ? t('leaderboardRewardsDisabledResult')
                : t('leaderboardRewardsNoReward');
  const dateLabel = `${formatUtcDate(reward.weekStartsAtUtc, language)} – ${formatUtcDate(reward.weekEndsAtUtc, language)} UTC`;
  const showFinalRank = isSettled || reward.status === 'pending' || isRetrying;

  return <View style={[styles.previousResult, isAwarded ? styles.previousSuccess : isSettled ? styles.previousFinished : styles.previousPending]}>
    <View style={styles.previousHeader}>
      <View style={styles.previousHeading}>
        <Text style={styles.previousLabel}>{t('leaderboardRewardsLastResult')}</Text>
        <Text style={styles.previousDates}>{dateLabel}</Text>
      </View>
      <View style={[styles.resultBadge, isAwarded ? styles.resultBadgeSuccess : isSettled ? styles.resultBadgeFinished : styles.resultBadgePending]}>
        {isAwarded ? <CheckCircle2 size={13} color={theme.successText} /> : <Clock3 size={13} color={theme.violetDeep} />}
        <Text style={[styles.resultBadgeText, isAwarded ? styles.successText : isSettled ? styles.finishedText : styles.pendingText]}>{stateLabel}</Text>
      </View>
    </View>
    {showFinalRank && reward.finalRank != null ? <Text style={styles.finalRank}>{t('leaderboardRewardsFinalRank', { rank: reward.finalRank })}</Text> : null}
    {isAwarded ? <>
      <View style={styles.awardedRow}>
        <Text style={styles.awardedAmount}>{reward.credits.toLocaleString()}</Text>
        <Text style={styles.awardedUnit}>{t('leaderboardRewardsCreditUnit')}</Text>
      </View>
      {reward.expiresAtUtc ? <Text style={styles.expiryText}>{t('leaderboardRewardsExpires', { date: formatUtcDate(reward.expiresAtUtc, language) })}</Text> : null}
      <AnimatedPressable accessibilityRole="button" onPress={onOpenWallet} style={styles.walletButton}>
        <Text style={styles.walletButtonText}>{t('leaderboardRewardsOpenWallet')}</Text>
        <ArrowRight size={15} color={theme.onAccent} />
      </AnimatedPressable>
    </> : null}
    {isSettled && !isAwarded ? <Text style={styles.resultExplanation}>{getSettledExplanation(reward, t)}</Text> : null}
    {isWaitingForReview || isProcessing || isRetrying
      ? <Text style={styles.resultExplanation}>{t(isRetrying ? 'leaderboardRewardsRetryNotice' : 'leaderboardRewardsProcessingNotice')}</Text>
      : null}
    {isStale ? <Text style={styles.staleNotice}>{t('leaderboardRewardsMayBeOutOfDate', {
      time: lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : t('leaderboardRewardsUnknownTime'),
    })}</Text> : null}
  </View>;
}

function getSettledExplanation(reward: LeaderboardRewardResult, t: PreviousRewardProps['t']) {
  if (reward.qualificationReason === 'opted-out') return t('leaderboardRewardsOptedOutDetail');
  if (reward.qualificationReason === 'minimum-active-days' ||
    (reward.qualificationReason == null && reward.status === 'not-eligible' && reward.activeDays < reward.minimumActiveDays)) {
    return t('leaderboardRewardsNotEligibleDetail', {
      days: reward.activeDays,
      target: reward.minimumActiveDays,
    });
  }
  if (reward.status === 'not-eligible') return t('leaderboardRewardsNotQualifiedDetail');
  if (reward.qualificationReason === 'outside-reward-ranks' || reward.status === 'outside-reward-ranks') return t('leaderboardRewardsOutsideRanksDetail');
  if (reward.qualificationReason === 'rewards-disabled' || (reward.status === 'no-reward' && !reward.rewardsEnabled)) return t('leaderboardRewardsDisabledDetail');
  if (reward.qualificationReason === 'no-credit-after-tie-split' || reward.status === 'no-reward') return t('leaderboardRewardsTieNoCreditsDetail');
  return '';
}

function formatUtcDate(value: string, language: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  if (language === 'zh') return `${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: 19, borderWidth: 1.5, overflow: 'hidden' },
  cardPressed: { opacity: 0.86 },
  cardSurface: { backgroundColor: theme.paper, gap: 9, minHeight: 112, padding: 12 },
  rewardHeader: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  rewardTitle: { color: theme.ink, flex: 1, fontFamily: typography.displayExtraBold, fontSize: 13 },
  top100: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 999, flexDirection: 'row', gap: 4, minHeight: 27, paddingHorizontal: 8 },
  top100Text: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9 },
  poolShowcase: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 52 },
  poolCopy: { gap: 0 },
  poolLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 9 },
  poolLine: { alignItems: 'baseline', flexDirection: 'row', gap: 5 },
  poolAmount: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: 30, letterSpacing: -0.5, lineHeight: 35 },
  poolUnit: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  coinArtwork: { height: 54, position: 'relative', width: 58 },
  coinDisc: { alignItems: 'center', backgroundColor: theme.sun, borderColor: theme.sunLine, borderRadius: 25, borderWidth: 2, bottom: 1, height: 48, justifyContent: 'center', position: 'absolute', right: 4, width: 48 },
  coinSparkle: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.sunLine, borderRadius: 10, borderWidth: 1, height: 22, justifyContent: 'center', position: 'absolute', right: 0, top: 0, width: 22 },
  disabledHeader: { alignItems: 'center', backgroundColor: theme.canvas, borderRadius: 16, flexDirection: 'row', gap: 9, padding: 12 },
  disabledIcon: { alignItems: 'center', backgroundColor: theme.line, borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  headingCopy: { flex: 1, gap: 1 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14 },
  subtitle: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11 },
  disabledNotice: { backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 13, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 9 },
  disabledText: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 16 },
  previousResult: { borderRadius: 16, borderWidth: 1, gap: 6, marginTop: 10, padding: 11 },
  previousSuccess: { backgroundColor: theme.mintTint, borderColor: theme.mintLine },
  previousFinished: { backgroundColor: theme.violetTint, borderColor: theme.violetLine },
  previousPending: { backgroundColor: theme.violetTint, borderColor: theme.violetLine },
  previousHeader: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'space-between' },
  previousHeading: { flex: 1, gap: 2, minWidth: 100 },
  previousLabel: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  previousDates: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10 },
  resultBadge: { alignItems: 'center', borderRadius: 999, flexDirection: 'row', gap: 4, minHeight: 25, paddingHorizontal: 8 },
  resultBadgeSuccess: { backgroundColor: '#FFFFFF' },
  resultBadgeFinished: { backgroundColor: '#FFFFFF' },
  resultBadgePending: { backgroundColor: '#FFFFFF' },
  resultBadgeText: { fontFamily: typography.bodyExtraBold, fontSize: 10 },
  successText: { color: theme.successText },
  finishedText: { color: theme.violetDeep },
  pendingText: { color: theme.violetDeep },
  finalRank: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  awardedRow: { alignItems: 'baseline', flexDirection: 'row', gap: 5 },
  awardedAmount: { color: theme.successText, fontFamily: typography.displayExtraBold, fontSize: 27, lineHeight: 32 },
  awardedUnit: { color: theme.successText, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  expiryText: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10 },
  walletButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: 11, flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 42, paddingHorizontal: 12 },
  walletButtonText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  resultExplanation: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, lineHeight: 15 },
  staleNotice: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, lineHeight: 14 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(39,31,62,0.42)' },
  rulesSheet: { backgroundColor: theme.paper, borderColor: theme.violetLine, borderTopLeftRadius: 25, borderTopRightRadius: 25, borderWidth: 1, gap: 11, maxHeight: '84%', paddingBottom: 28, paddingHorizontal: 18, paddingTop: 11 },
  sheetHandle: { alignSelf: 'center', backgroundColor: theme.line, borderRadius: 999, height: 4, width: 38 },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sheetTitleGroup: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 9 },
  sheetIcon: { alignItems: 'center', backgroundColor: theme.sunTint, borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  sheetTitle: { color: theme.ink, flex: 1, fontFamily: typography.displayExtraBold, fontSize: 16 },
  closeButton: { alignItems: 'center', backgroundColor: theme.canvas, borderRadius: 12, height: 44, justifyContent: 'center', width: 44 },
  rulesContent: { gap: 8, paddingBottom: 8 },
  rulesIntro: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, paddingBottom: 3 },
  tierRow: { alignItems: 'center', backgroundColor: theme.sunTint, borderColor: theme.sunLine, borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 43, paddingHorizontal: 12 },
  tierRank: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  tierCredits: { color: theme.onSun, fontFamily: typography.displayExtraBold, fontSize: 12 },
  rulesFootnote: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 17, paddingTop: 3 },
}));
