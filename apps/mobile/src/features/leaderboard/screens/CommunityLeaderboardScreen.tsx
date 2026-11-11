import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useRouter } from 'expo-router';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppButton } from '@/components/ui/AppButton';
import { CommonHeader } from '@/components/CommonHeader';
import { ConfirmModal } from '@/components/ConfirmModal';
import LoadingView from '@/components/LoadingView';
import { useTranslation } from '@/core/i18n/useTranslation';
import { ArrowRight, CircleHelp, Flame, LockKeyhole, Sparkles, Trophy, Users, X } from '@/core/icons';
import { useAuth } from '@/contexts/AuthProvider';
import { CommunityLeaderboardShareButton } from '@/features/leaderboard/components/CommunityLeaderboardShareButton';
import { LeaderboardRewardPanel } from '@/features/leaderboard/components/LeaderboardRewardPanel';
import { LeaderboardTaskChecklist } from '@/features/leaderboard/components/LeaderboardTaskChecklist';
import { LeaderboardEntryRow, LeaderboardStandings } from '@/features/leaderboard/components/LeaderboardStandings';
import { useCommunityLeaderboard, useCommunityLeaderboardPreference } from '@/features/leaderboard/hooks/useCommunityLeaderboard';
import { getLeaderboardMomentum } from '@/features/leaderboard/utils/leaderboardMomentum';
import { getLeaderboardPodiumSlots } from '@/features/leaderboard/utils/leaderboardPodium';
import { LEADERBOARD_PALETTE } from '@/features/leaderboard/leaderboardPalette';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';

const RACE_PALETTE = {
  ...LEADERBOARD_PALETTE,
  heroInk: '#FFFFFF',
  heroMuted: 'rgba(255,255,255,0.9)',
} as const;

export default function CommunityLeaderboardScreen() {
  const { t, language } = useTranslation('library');
  const { t: tHome } = useTranslation('home');
  const { t: tAuth } = useTranslation('auth');
  const { styles, theme } = useStyles();
  const router = useRouter();
  const auth = useAuth();
  const [scoreHelpOpen, setScoreHelpOpen] = useState(false);
  const [confirmJoin, setConfirmJoin] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const leaderboard = useCommunityLeaderboard();
  const preference = useCommunityLeaderboardPreference();
  const data = leaderboard.data;
  const boardTasks = data?.board?.tasks ?? [];
  const todayTasks = data?.todayTasks ?? [];
  const completedTaskCount = todayTasks.filter(task => task.isCompleted).length;
  const myPoints = data ? (data.optedIn && data.myScore != null ? data.myScore : data.personalGoalScore) : 0;
  const momentum = data?.optedIn && data.eligibleParticipants > 1
    ? getLeaderboardMomentum(data.entries, data.myScore, data.myRank)
    : null;
  const myRank = data?.myRank ?? (data?.optedIn && data.eligibleParticipants === 1 ? 1 : null);
  const isLeader = data?.optedIn === true && myRank === 1;
  const podiumEntries = data?.entries.filter((entry) => entry.rank <= 3) ?? [];
  if (data?.optedIn && myRank != null && myRank <= 3 && !podiumEntries.some((entry) => entry.isCurrentUser)) {
    podiumEntries.push({ rank: myRank, alias: t('leaderboardYou'), score: myPoints, isCurrentUser: true });
  }
  const podiumSlots = getLeaderboardPodiumSlots(podiumEntries);
  const podiumWinners = podiumSlots.flatMap(({ entry }) => entry ? [entry] : []);
  const podiumWinnerSet = new Set(podiumWinners);
  const additionalEntries = data?.entries.filter((entry) => entry.rank > 3 || !podiumWinnerSet.has(entry)) ?? [];

  if (auth.isLoading || (leaderboard.isLoading && !data)) return <View style={styles.page}>
    <CommonHeader title={t('leaderboardDetailTitle')} backAction={() => router.back()} showAiCredits={false} />
    <LoadingView description={t('leaderboardLoading')} />
  </View>;

  const joinBoard = () => {
    if (data && !data.optedIn && !preference.isPending) setConfirmJoin(true);
  };
  const confirmJoinBoard = () => {
    if (!data || data.optedIn || preference.isPending) return;
    preference.mutate(true, {
      onSuccess: () => setConfirmJoin(false),
      onError: () => setConfirmJoin(false),
    });
  };
  const goToPractice = () => router.push('/memory-tools' as Href);
  const scoreGuide = <View style={styles.scoreGuide}>
    <View style={styles.dailyCap}><Flame size={13} color={theme.sunDeep} /><Text style={styles.dailyCapText}>{t('leaderboardDailyCap', { points: boardTasks.reduce((sum, task) => sum + task.points, 0) })}</Text></View>
    <LeaderboardTaskChecklist tasks={todayTasks} compact />
    <Text style={styles.scoreNote}>{t('leaderboardScoreExplainer')}</Text>
  </View>;

  return <View style={styles.page}>
    <CommonHeader
      title={data ? (language === 'zh' ? data.board.titleZh : data.board.titleEn) : t('leaderboardDetailTitle')}
      backAction={() => router.back()}
      actions={[{ icon: CircleHelp, onPress: () => setScoreHelpOpen(true), accessibilityLabel: t('leaderboardScoreHelp') }]}
      showAiCredits={false} />
    {!auth.user ? <View style={styles.signInCard}>
      <View style={styles.signInIcon}><LockKeyhole size={22} color={theme.violetDeep} /></View>
      <Text style={styles.confirmTitle}>{t('leaderboardSignInTitle')}</Text>
      <Text style={styles.body}>{t('leaderboardSignInBody')}</Text>
      <AppButton fullWidth label={tAuth('signIn')} onPress={() => router.push({ pathname: '/login', params: { returnTo: '/community/leaderboard' } })} style={styles.signInButton} trailingIcon={ArrowRight} />
    </View> : null}
    {auth.user && leaderboard.isError && !data ? <View style={styles.notice}>
      <Text accessibilityRole="alert" style={styles.body}>{t('leaderboardUnavailable')}</Text>
      <AppButton label={t('retry')} onPress={() => void leaderboard.refetch()} size="compact" style={styles.retryButton} variant="secondary" />
    </View> : null}
    {auth.user && data ? <FlatList
      data={data.optedIn ? additionalEntries : []}
      keyExtractor={(item) => `${item.rank}-${item.alias}`}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={leaderboard.isRefetching} onRefresh={() => void leaderboard.refetch()} />}
      ListHeaderComponent={<View style={styles.sections}>
        {leaderboard.isError ? <View style={styles.refreshWarning}>
          <Text style={styles.refreshWarningText}>{t('leaderboardUnavailable')}</Text>
          <AnimatedPressable accessibilityRole="button" onPress={() => void leaderboard.refetch()} style={styles.refreshRetry}>
            <Text style={styles.refreshRetryText}>{t('retry')}</Text>
          </AnimatedPressable>
        </View> : null}
        <LinearGradient
          colors={[RACE_PALETTE.heroLilac, RACE_PALETTE.heroPurple]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View pointerEvents="none" style={styles.heroDecoration}>
            <View style={styles.heroOrbit} />
            <Sparkles size={42} color="rgba(255,255,255,0.46)" />
          </View>
          <View style={styles.heroTopline}>
            <View style={styles.weekBadge}><Trophy size={15} color={RACE_PALETTE.violet} /><Text style={styles.weekBadgeText}>{t('leaderboardThisWeek')}</Text></View>
            <Text style={styles.weekDates}>{t('leaderboardWeekDates', { start: formatWeek(data.weekStartsAtUtc), end: formatWeek(data.weekEndsAtUtc) })}</Text>
          </View>
          <Text style={styles.heroTitle}>{language === 'zh' ? data.board.titleZh : data.board.titleEn}</Text>
          <Text numberOfLines={2} style={styles.heroSubtitle}>{language === 'zh' ? data.board.descriptionZh : data.board.descriptionEn}</Text>
          <View style={styles.scorePanel}>
            <View style={styles.scoreCopy}>
              <Text style={styles.scoreLabel}>{t(data.optedIn ? 'leaderboardPoints' : 'leaderboardPersonalGoal')}</Text>
              <View style={styles.scoreLine}><Text style={styles.score}>{myPoints}</Text><Text style={styles.scoreUnit}>{t('leaderboardScoreUnit')}</Text></View>
            </View>
            {data.optedIn && myRank != null ? <View style={styles.rankPanel}>
              <Text style={styles.rankLabel}>{t('leaderboardRankShort')}</Text><Text style={[styles.rank, isLeader && styles.rankLeader]}>#{myRank}</Text>
            </View> : <View style={[styles.statusPill, data.optedIn ? styles.joinedPill : styles.privatePill]}>
              {data.optedIn ? <Flame size={14} color="#FFFFFF" /> : <LockKeyhole size={14} color={theme.violetDeep} />}
              <Text style={[styles.statusPillText, !data.optedIn && styles.privatePillText]}>{t(data.optedIn ? 'leaderboardJoinedBadge' : 'leaderboardPrivateBadge')}</Text>
            </View>}
          </View>
          <View style={styles.heroActions}>
            <AppButton
              disabled={!data.optedIn && preference.isPending}
              label={data.optedIn ? t('leaderboardPracticeAction') : preference.isPending ? t('leaderboardSaving') : t('leaderboardJoin')}
              loading={!data.optedIn && preference.isPending}
              onPress={data.optedIn ? goToPractice : joinBoard}
              size="compact"
              style={styles.heroAction}
              trailingIcon={ArrowRight}
            />
            {todayTasks.length > 0 ? <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={`${t('leaderboardTodayTasks')}, ${t('leaderboardTaskSummary', { completed: completedTaskCount, total: todayTasks.length })}`}
              onPress={() => setScoreHelpOpen(true)}
              style={styles.heroTaskAction}>
              <Sparkles size={15} color={theme.violetDeep} />
              <Text style={styles.heroTaskLabel}>{t('leaderboardTaskButton')}</Text>
              <View style={styles.heroTaskBadge}><Text style={styles.heroTaskBadgeText}>{completedTaskCount}/{todayTasks.length}</Text></View>
            </AnimatedPressable> : null}
          </View>
        </LinearGradient>

        <LeaderboardRewardPanel
          rewards={data.board.rewards}
          currentWeekStartsAtUtc={data.weekStartsAtUtc}
          latestReward={data.latestReward}
          isStale={leaderboard.isError}
          lastUpdatedAt={leaderboard.dataUpdatedAt} />

        {data.optedIn ? <LeaderboardStandings
          title={t('leaderboardStandings')}
          participantCount={data.eligibleParticipants}
          slots={podiumSlots}
          youLabel={t('leaderboardYou')}
          scoreUnit={t('leaderboardScoreUnit')}
          openSlotLabel={t('leaderboardPodiumOpenSlot')}
        /> : null}

        {!data.optedIn || (data.entries.length === 0 && !podiumEntries.some((entry) => entry.isCurrentUser)) ? <View style={[styles.previewCard, data.optedIn && styles.previewCardJoined, isLeader && styles.previewCardLeader]}>
          {!data.optedIn ? <View style={styles.previewHeader}>
            <View style={styles.previewHeading}>
              <View style={styles.previewIcon}><Trophy size={16} color={theme.violetDeep} /></View>
              <View style={styles.previewHeadingCopy}>
                <Text style={styles.sectionTitle}>{t('leaderboardPreviewTitle')}</Text>
                <Text style={styles.previewSubtitle}>{t('leaderboardPreviewSubtitle')}</Text>
              </View>
            </View>
            <View style={styles.previewBadge}>
              <Sparkles size={12} color={theme.violetDeep} />
              <Text style={styles.previewBadgeText}>{t('leaderboardPreviewBadge')}</Text>
            </View>
          </View> : null}
          <View style={[styles.previewRow, styles.previewYouRow, data.optedIn && styles.previewYouRowJoined, isLeader && styles.previewYouRowLeader]}>
            <View style={[styles.previewRankBadge, styles.previewYourRank, data.optedIn && styles.previewYourRankJoined, isLeader && styles.previewYourRankLeader]}>
              <Text style={[styles.previewRankText, styles.previewYourRankText, data.optedIn && styles.previewYourRankJoinedText, isLeader && styles.previewYourRankLeaderText]}>{myRank != null ? `#${myRank}` : '—'}</Text>
            </View>
            <View style={[styles.previewYourAvatar, data.optedIn && styles.previewYourAvatarJoined, isLeader && styles.previewYourAvatarLeader]}>
              {isLeader ? <Trophy size={14} color={theme.sunDeep} /> : data.optedIn ? <Flame size={14} color={RACE_PALETTE.joined} /> : <LockKeyhole size={14} color={theme.violetDeep} />}
            </View>
            <View style={styles.previewYouCopy}>
              <Text style={styles.previewYouTitle}>{t('leaderboardYou')}</Text>
            </View>
            <Text style={styles.previewPoints}>{data.optedIn ? myPoints : '—'}<Text style={styles.rowScoreUnit}>{data.optedIn ? ` ${t('leaderboardScoreUnit')}` : ''}</Text></Text>
          </View>
        </View> : null}

        {!data.optedIn && data.eligibleParticipants > 0 ? <View style={styles.activeBoardCard}>
          <View style={styles.peopleIcon}><Users size={18} color={theme.violetDeep} /></View>
          <Text style={styles.activeBoardText}>{t('leaderboardActiveBoard', { count: data.eligibleParticipants })}</Text>
        </View> : null}

        {!data.optedIn && preference.isError ? <Text accessibilityRole="alert" style={styles.errorText}>{t('leaderboardPreferenceError')}</Text> : null}

      </View>}
      renderItem={({ item, index }) => <View>
        {index > 0 && item.rank > additionalEntries[index - 1].rank + 1 ? <View style={styles.rankGap}>
          <View style={styles.rankGapLine} /><Text style={styles.rankGapText}>···</Text><View style={styles.rankGapLine} />
        </View> : null}
        <LeaderboardEntryRow entry={item} youLabel={t('leaderboardYou')} scoreUnit={t('leaderboardScoreUnit')} />
      </View>}
      ListFooterComponent={<View style={[styles.sections, styles.scoreFooter]}>
        {data.optedIn && momentum ? <View style={styles.momentumCard}>
          <View style={styles.momentumIcon}><Trophy size={16} color={theme.sunDeep} /></View>
          <Text style={styles.momentumText}>{momentum.kind === 'gap'
            ? tHome('leaderboardProgressGap', { points: momentum.pointsToMoveAhead })
            : tHome('leaderboardProgressTop')}</Text>
          {myRank != null ? <Text style={styles.momentumRank}>#{myRank}</Text> : null}
        </View> : null}
        {data.optedIn ? <>
          <View style={styles.shareRow}>
            {myPoints > 0 ? <CommunityLeaderboardShareButton points={myPoints} rank={myRank} /> : <View />}
            <AnimatedPressable accessibilityRole="button" onPress={() => setConfirmLeave((value) => !value)} style={styles.leaveButton}>
              <Text style={styles.leaveButtonText}>{t(confirmLeave ? 'cancel' : 'leaderboardLeave')}</Text>
            </AnimatedPressable>
          </View>
          {confirmLeave ? <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{t('leaderboardLeaveTitle')}</Text>
            <Text style={styles.body}>{t('leaderboardLeaveBody')}</Text>
            <View style={styles.confirmActions}>
              <AppButton label={t('cancel')} onPress={() => setConfirmLeave(false)} size="compact" style={styles.confirmAction} variant="secondary" />
              <AppButton disabled={preference.isPending} label={preference.isPending ? t('leaderboardSaving') : t('leaderboardLeave')} loading={preference.isPending} onPress={() => { preference.mutate(false); setConfirmLeave(false); }} size="compact" style={styles.confirmAction} variant="destructive" />
            </View>
          </View> : null}
          {preference.isError ? <Text accessibilityRole="alert" style={styles.errorText}>{t('leaderboardPreferenceError')}</Text> : null}
        </> : null}
      </View>}
    /> : null}
    <ConfirmModal
      visible={confirmJoin}
      icon={<Trophy size={27} color={theme.violetDeep} />}
      title={t('leaderboardJoinTitle')}
      description={data?.board.rewards?.enabled
        ? t('leaderboardJoinBody', {
          days: data.board.rewards.minimumActiveDays,
          expiryDays: data.board.rewards.expiryDays,
        })
        : t('leaderboardJoinBodyNoRewards')}
      confirmText={t('leaderboardJoin')}
      cancelText={t('cancel')}
      isLoading={preference.isPending}
      onConfirm={confirmJoinBoard}
      onCancel={() => setConfirmJoin(false)} />
    <Modal
      visible={scoreHelpOpen}
      transparent
      animationType="fade"
      accessibilityViewIsModal
      onRequestClose={() => setScoreHelpOpen(false)}>
      <View style={styles.helpBackdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('leaderboardCloseScoreHelp')}
          onPress={() => setScoreHelpOpen(false)}
          style={styles.helpDismissArea} />
        <View style={styles.helpDialog}>
          <View style={styles.helpHeader}>
            <View style={styles.scoreGuideIcon}><Sparkles size={17} color={theme.violetDeep} /></View>
            <Text style={styles.helpTitle}>{t('leaderboardHowWorks')}</Text>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={t('leaderboardCloseScoreHelp')}
              onPress={() => setScoreHelpOpen(false)}
              style={styles.helpClose}>
              <X size={20} color={theme.inkSoft} />
            </AnimatedPressable>
          </View>
          <ScrollView style={styles.helpScroll} showsVerticalScrollIndicator={false}>
            {scoreGuide}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </View>;
}

function formatWeek(value: string) {
  const date = new Date(value);
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { backgroundColor: theme.canvas, flex: 1 },
  content: { gap: appSpacing.sm, padding: 14, paddingBottom: 30 },
  sections: { gap: 10 },
  scoreFooter: { paddingTop: appSpacing.md },
  rankGap: { alignItems: 'center', flexDirection: 'row', gap: 9, height: 22, paddingHorizontal: 18 },
  rankGapLine: { borderTopColor: theme.line, borderTopWidth: 1, flex: 1 },
  rankGapText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  helpBackdrop: { alignItems: 'center', backgroundColor: 'rgba(39,31,62,0.48)', flex: 1, justifyContent: 'center', padding: appSpacing.xl },
  helpDismissArea: { ...StyleSheet.absoluteFillObject },
  helpDialog: { backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: appRadii.hero, borderWidth: 1.5, gap: appSpacing.md, maxHeight: '86%', maxWidth: 430, overflow: 'hidden', padding: appSpacing.lg, width: '100%' },
  helpHeader: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  helpScroll: { flexShrink: 1 },
  helpTitle: { color: theme.ink, flex: 1, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize, lineHeight: appTextStyles.sectionTitle.lineHeight },
  helpClose: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: appRadii.control, height: 44, justifyContent: 'center', width: 44 },
  signInCard: { alignItems: 'center', alignSelf: 'center', backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: appRadii.card, borderWidth: 1.5, gap: 10, margin: appSpacing.lg, marginTop: 22, maxWidth: 420, padding: 22, width: '90%' },
  signInIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: appRadii.control, height: 52, justifyContent: 'center', width: 52 },
  signInButton: { marginTop: 3 },
  refreshWarning: { alignItems: 'center', backgroundColor: theme.sunTint, borderColor: theme.sunLine, borderRadius: appRadii.control, borderWidth: 1, flexDirection: 'row', gap: appSpacing.sm, justifyContent: 'space-between', paddingHorizontal: 11, paddingVertical: appSpacing.sm },
  refreshWarningText: { color: theme.inkSoft, flex: 1, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  refreshRetry: { alignItems: 'center', justifyContent: 'center', minHeight: 34, paddingHorizontal: 7 },
  refreshRetryText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  heroCard: { borderRadius: appRadii.hero, gap: appSpacing.sm, overflow: 'hidden', padding: 14 },
  heroDecoration: { alignItems: 'center', height: 66, justifyContent: 'center', opacity: 0.76, position: 'absolute', right: 12, top: 32, width: 66 },
  heroOrbit: { borderColor: 'rgba(255,255,255,0.2)', borderRadius: appRadii.pill, borderWidth: 1, height: 62, position: 'absolute', width: 62 },
  heroTopline: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'space-between', paddingRight: 2 },
  weekBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.78)', borderRadius: appRadii.pill, flexDirection: 'row', gap: 6, minHeight: 29, paddingHorizontal: 10 },
  weekBadgeText: { color: RACE_PALETTE.violet, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  weekDates: { color: RACE_PALETTE.heroMuted, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  heroTitle: { color: RACE_PALETTE.heroInk, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.prompt.fontSize, lineHeight: appTextStyles.prompt.lineHeight, marginTop: 1, maxWidth: '88%' },
  heroSubtitle: { color: RACE_PALETTE.heroMuted, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, maxWidth: '88%' },
  scorePanel: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.86)', borderColor: 'rgba(255,255,255,0.96)', borderRadius: appRadii.control, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: appSpacing.md, paddingVertical: appSpacing.sm },
  scoreCopy: { flex: 1 },
  scoreLabel: { color: RACE_PALETTE.scoreMuted, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  scoreLine: { alignItems: 'baseline', flexDirection: 'row', gap: 6, marginTop: 1 },
  score: { color: RACE_PALETTE.score, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.display.fontSize, lineHeight: appTextStyles.display.lineHeight },
  scoreUnit: { color: RACE_PALETTE.scoreMuted, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  rankPanel: { alignItems: 'center', borderLeftColor: 'rgba(91,62,120,0.22)', borderLeftWidth: 1, minWidth: 68, paddingLeft: appSpacing.md },
  rankLabel: { color: RACE_PALETTE.scoreMuted, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  rank: { color: RACE_PALETTE.score, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.stat.fontSize, marginTop: 1 },
  rankLeader: { color: RACE_PALETTE.goldInk },
  statusPill: { alignItems: 'center', borderRadius: appRadii.pill, flexDirection: 'row', gap: 5, minHeight: 30, paddingHorizontal: 10 },
  joinedPill: { backgroundColor: RACE_PALETTE.joined },
  privatePill: { backgroundColor: theme.paper },
  statusPillText: { color: '#FFFFFF', fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  privatePillText: { color: theme.violetDeep },
  heroActions: { alignItems: 'stretch', flexDirection: 'row', gap: appSpacing.sm },
  heroAction: { flex: 1 },
  heroTaskAction: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.94)', borderColor: 'rgba(255,255,255,0.9)', borderRadius: appRadii.control, borderWidth: 1, flexDirection: 'row', gap: 5, justifyContent: 'center', minHeight: 44, paddingHorizontal: appSpacing.sm },
  heroTaskLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  heroTaskBadge: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 8, justifyContent: 'center', minHeight: 23, minWidth: 27, paddingHorizontal: appSpacing.xs },
  heroTaskBadgeText: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.caption.fontSize },
  scoreGuide: { backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: 19, borderWidth: 1, gap: 10, padding: 13 },
  scoreGuideIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 11, height: 31, justifyContent: 'center', width: 31 },
  sectionTitle: { color: theme.ink, flex: 1, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize, lineHeight: appTextStyles.sectionTitle.lineHeight },
  dailyCap: { alignItems: 'center', backgroundColor: theme.sunTint, borderRadius: appRadii.pill, flexDirection: 'row', gap: appSpacing.xs, minHeight: 26, paddingHorizontal: appSpacing.sm },
  dailyCapText: { color: theme.sunDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  scoreSteps: { flexDirection: 'row', gap: appSpacing.sm },
  scoreStep: { alignItems: 'center', borderRadius: appRadii.control, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 9, minHeight: 66, paddingHorizontal: 10, paddingVertical: appSpacing.sm },
  recallStep: { backgroundColor: theme.violetTint, borderColor: theme.violetLine },
  reviewStep: { backgroundColor: theme.sunTint, borderColor: theme.sunLine },
  pointsBadge: { alignItems: 'center', backgroundColor: theme.violetDeep, borderRadius: 11, height: 39, justifyContent: 'center', minWidth: 42, paddingHorizontal: appSpacing.xs },
  bonusBadge: { backgroundColor: theme.sun },
  pointsNumber: { color: theme.onAccent, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize, lineHeight: appTextStyles.sectionTitle.lineHeight },
  bonusNumber: { color: theme.onSun },
  pointsUnit: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  ruleText: { color: theme.ink, flex: 1, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  scoreNote: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, paddingHorizontal: 2 },
  peopleIcon: { alignItems: 'center', backgroundColor: theme.paper, borderRadius: appRadii.control, height: 37, justifyContent: 'center', width: 37 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  participantCountText: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.cardTitle.fontSize },
  momentumCard: { alignItems: 'center', backgroundColor: theme.sunTint, borderColor: theme.sunLine, borderRadius: appRadii.control, borderWidth: 1, flexDirection: 'row', gap: 9, minHeight: 48, paddingHorizontal: 11, paddingVertical: 7 },
  momentumIcon: { alignItems: 'center', backgroundColor: theme.paper, borderRadius: 11, height: 30, justifyContent: 'center', width: 30 },
  momentumText: { color: theme.ink, flex: 1, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  momentumRank: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.cardTitle.fontSize },
  shareRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 42 },
  leaveButton: { alignItems: 'center', alignSelf: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: appSpacing.md },
  leaveButtonText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  activeBoardCard: { alignItems: 'center', backgroundColor: theme.mintTint, borderColor: theme.mintLine, borderRadius: appRadii.control, borderWidth: 1, flexDirection: 'row', gap: 9, padding: 11 },
  activeBoardText: { color: theme.ink, flex: 1, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  previewCard: { backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: 19, borderWidth: 1.5, gap: appSpacing.sm, padding: appSpacing.md },
  previewCardJoined: { borderColor: theme.mintLine },
  previewCardLeader: { borderColor: theme.sunLine },
  previewHeader: { alignItems: 'center', flexDirection: 'row', gap: appSpacing.sm, justifyContent: 'space-between', marginBottom: 2 },
  previewHeading: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: appSpacing.sm },
  previewIcon: { alignItems: 'center', backgroundColor: theme.sunTint, borderRadius: appRadii.control, height: 34, justifyContent: 'center', width: 34 },
  previewHeadingCopy: { flex: 1, gap: 1 },
  previewSubtitle: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  previewBadge: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: appRadii.pill, flexDirection: 'row', gap: appSpacing.xs, minHeight: 26, paddingHorizontal: appSpacing.sm },
  previewBadgeText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  previewRow: { alignItems: 'center', backgroundColor: theme.canvas, borderRadius: appRadii.control, flexDirection: 'row', gap: appSpacing.sm, minHeight: 43, paddingHorizontal: 7 },
  previewRankBadge: { alignItems: 'center', borderRadius: 9, height: 28, justifyContent: 'center', width: 38 },
  previewRankText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  previewPoints: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, minWidth: 48, textAlign: 'right' },
  rowScoreUnit: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize },
  previewYouRow: { backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderStyle: 'dashed', borderWidth: 1, marginTop: 1 },
  previewYouRowJoined: { backgroundColor: theme.mintTint, borderColor: theme.mintLine, borderStyle: 'solid', borderWidth: 1.5 },
  previewYouRowLeader: { backgroundColor: theme.sunTint, borderColor: theme.sunLine },
  previewYourRank: { backgroundColor: theme.paper },
  previewYourRankText: { color: theme.inkSoft },
  previewYourRankJoined: { backgroundColor: theme.sun },
  previewYourRankJoinedText: { color: theme.onSun },
  previewYourRankLeader: { backgroundColor: theme.sun },
  previewYourRankLeaderText: { color: theme.onSun },
  previewYourAvatar: { backgroundColor: theme.paper },
  previewYourAvatarJoined: { backgroundColor: theme.paper },
  previewYourAvatarLeader: { backgroundColor: theme.sunTint },
  previewYouCopy: { flex: 1, gap: 1 },
  previewYouTitle: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  notice: { alignItems: 'center', gap: appSpacing.md, padding: appSpacing.xl },
  errorText: { color: theme.berryDeep, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize },
  confirmCard: { backgroundColor: theme.paper, borderColor: theme.berryDeep, borderRadius: appRadii.control, borderWidth: 1, gap: 9, padding: 13 },
  confirmTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize },
  confirmActions: { flexDirection: 'row', gap: 9, marginTop: 2 },
  retryButton: { alignSelf: 'center' },
  confirmAction: { flex: 1 },
}));
