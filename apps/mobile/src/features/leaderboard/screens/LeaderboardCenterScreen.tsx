import { Href, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useTranslation } from '@/core/i18n/useTranslation';
import { ArrowRight, LockKeyhole, Trophy, Users } from '@/core/icons';
import { useAuth } from '@/contexts/AuthProvider';
import { useCommunityLeaderboard, useLeaderboardCatalog } from '@/features/leaderboard/hooks/useCommunityLeaderboard';
import { LEADERBOARD_PALETTE } from '@/features/leaderboard/leaderboardPalette';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';

export default function LeaderboardCenterScreen() {
  const { t, language } = useTranslation('library');
  const { t: tAuth } = useTranslation('auth');
  const { styles, theme } = useStyles();
  const router = useRouter();
  const auth = useAuth();
  const catalog = useLeaderboardCatalog();
  const configuredBoards = catalog.data?.boards ?? [];
  const hasCommunityWeeklyBoard = configuredBoards.some((board) => board.id === 'community-weekly' && board.kind === 'community-weekly-recall');
  const leaderboard = useCommunityLeaderboard(hasCommunityWeeklyBoard);
  const data = leaderboard.data;
  const cards = configuredBoards.flatMap((board) => {
    if (board.kind !== 'community-weekly-recall' || board.id !== 'community-weekly' || !data) return [];
    return [{
      id: board.id,
      board,
      title: language === 'zh' ? board.titleZh : board.titleEn,
      description: language === 'zh' ? board.descriptionZh : board.descriptionEn,
      scoreLabel: t(data.optedIn ? 'leaderboardPoints' : 'leaderboardPersonalGoal'),
      score: data.optedIn ? data.myScore ?? data.personalGoalScore : data.personalGoalScore,
      rankLabel: t('leaderboardRankShort'),
      rank: data.optedIn ? data.myRank : null,
      participantCount: data.eligibleParticipants,
      rankHint: t(data.optedIn ? 'leaderboardCenterRankPendingHint' : 'leaderboardCenterPrivateHint'),
      weekStartsAtUtc: data.weekStartsAtUtc,
      weekEndsAtUtc: data.weekEndsAtUtc,
    }];
  });

  return <View style={styles.page}>
    <CommonHeader
      title={t('leaderboardTitle')}
      description={t('leaderboardDescription')}
      backAction={() => router.back()}
      showAiCredits={false} />
    {(auth.isLoading || (catalog.isLoading && !catalog.data) || (hasCommunityWeeklyBoard && leaderboard.isLoading && !data)) ? <LoadingView description={t('leaderboardLoading')} /> : null}
    {!auth.isLoading && !auth.user ? <View style={styles.signInCard}>
      <View style={styles.signInIcon}><LockKeyhole size={22} color={theme.violetDeep} /></View>
      <Text style={styles.signInTitle}>{t('leaderboardSignInTitle')}</Text>
      <Text style={styles.body}>{t('leaderboardSignInBody')}</Text>
      <AnimatedPressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/login', params: { returnTo: '/community/leaderboard' } })}
        style={styles.retryButton}>
        <Text style={styles.retryText}>{tAuth('signIn')}</Text>
        <ArrowRight size={16} color={theme.onAccent} />
      </AnimatedPressable>
    </View> : null}
    {auth.user && (catalog.isError || (hasCommunityWeeklyBoard && leaderboard.isError && !data)) ? <View style={styles.errorState}>
      <Text accessibilityRole="alert" style={styles.body}>{t('leaderboardUnavailable')}</Text>
      <AnimatedPressable accessibilityRole="button" onPress={() => { void catalog.refetch(); if (hasCommunityWeeklyBoard) void leaderboard.refetch(); }} style={styles.retryButton}>
        <Text style={styles.retryText}>{t('retry')}</Text>
      </AnimatedPressable>
    </View> : null}
    {auth.user && catalog.data && !catalog.isError && (!hasCommunityWeeklyBoard || Boolean(data)) ? <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={leaderboard.isRefetching} onRefresh={() => void leaderboard.refetch()} />}
      showsVerticalScrollIndicator={false}>
      <View style={styles.cardList}>
        {cards.map((card) => <AnimatedPressable
          key={card.id}
          accessibilityRole="button"
          accessibilityLabel={`${card.title}. ${card.description}. ${t('leaderboardCenterDetails')}`}
          onPress={() => router.push(getBoardPath(card.board))}
          style={styles.boardCard}>
          <LinearGradient
            colors={[LEADERBOARD_PALETTE.heroLilac, LEADERBOARD_PALETTE.heroPurple]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardHero}>
            <View style={styles.heroTopline}>
              <View style={styles.challengePill}>
                <Trophy size={14} color={LEADERBOARD_PALETTE.violet} />
                <Text style={styles.challengePillText}>{t('leaderboardThisWeek')}</Text>
              </View>
              <Text style={styles.periodMetaLight}>{t('leaderboardWeekDates', {
                start: formatWeek(card.weekStartsAtUtc),
                end: formatWeek(card.weekEndsAtUtc),
              })}</Text>
            </View>
            <Text numberOfLines={2} style={styles.heroTitle}>{card.title}</Text>
            <Text numberOfLines={2} style={styles.heroDescription}>{card.description}</Text>
            <View style={styles.scorePanel}>
              <View style={styles.scoreCopy}>
                <Text style={styles.scoreLabel}>{card.scoreLabel}</Text>
                <Text style={styles.scoreValue}>{card.score}<Text style={styles.scoreUnit}> {t('leaderboardScoreUnit')}</Text></Text>
              </View>
              <View style={styles.rankPanel}>
                <Text style={styles.rankLabel}>{card.rankLabel}</Text>
                {card.rank != null
                  ? <Text style={[styles.rankValue, card.rank === 1 && styles.rankValueLeader]}>#{card.rank}</Text>
                  : <Text numberOfLines={2} style={styles.rankHint}>{card.rankHint}</Text>}
              </View>
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.participantMeta}>
                <Users size={15} color="#FFFFFF" />
                <Text style={styles.participantTextLight}>{t('leaderboardActiveCount', { count: card.participantCount })}</Text>
              </View>
              <ArrowRight size={19} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </AnimatedPressable>)}
      </View>
      {cards.length === 0 ? <View style={styles.emptyCard}>
        <View style={styles.emptyIcon}><Trophy size={20} color={theme.violetDeep} /></View>
        <Text style={styles.emptyTitle}>{t('leaderboardCatalogEmpty')}</Text>
        <Text style={styles.body}>{t('leaderboardCatalogEmptyDescription')}</Text>
      </View> : null}
    </ScrollView> : null}
  </View>;
}

function getBoardPath(board: { id: string; kind: string }): Href {
  if (board.kind === 'community-weekly-recall' && board.id === 'community-weekly')
    return '/community/leaderboard/community-weekly';
  return '/community/leaderboard';
}

function formatWeek(value: string) {
  const date = new Date(value);
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { backgroundColor: theme.canvas, flex: 1 },
  content: { gap: 12, padding: 16, paddingBottom: 30 },
  cardList: { gap: 12 },
  boardCard: { borderRadius: 24, overflow: 'hidden', width: '100%' },
  cardHero: { borderRadius: 24, gap: 11, padding: 16 },
  heroTopline: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  challengePill: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.78)', borderRadius: 999, flexDirection: 'row', gap: 6, minHeight: 30, paddingHorizontal: 10 },
  challengePillText: { color: LEADERBOARD_PALETTE.violet, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  periodMetaLight: { color: 'rgba(255,255,255,0.9)', fontFamily: typography.bodyExtraBold, fontSize: 10 },
  heroTitle: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 22, lineHeight: 28, marginTop: 2 },
  heroDescription: { color: 'rgba(255,255,255,0.92)', fontFamily: typography.bodyBold, fontSize: 13, lineHeight: 19 },
  scorePanel: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.86)', borderColor: 'rgba(255,255,255,0.96)', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 12, justifyContent: 'space-between', marginTop: 2, paddingHorizontal: 12, paddingVertical: 8 },
  scoreCopy: { flex: 1 },
  scoreLabel: { color: LEADERBOARD_PALETTE.scoreMuted, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  scoreValue: { color: LEADERBOARD_PALETTE.score, fontFamily: typography.displayExtraBold, fontSize: 30, lineHeight: 36 },
  scoreUnit: { color: LEADERBOARD_PALETTE.score, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  rankPanel: { alignItems: 'flex-end', borderLeftColor: 'rgba(91,62,120,0.22)', borderLeftWidth: 1, maxWidth: '56%', minHeight: 46, justifyContent: 'center', paddingLeft: 12 },
  rankLabel: { color: LEADERBOARD_PALETTE.scoreMuted, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  rankValue: { color: LEADERBOARD_PALETTE.score, fontFamily: typography.displayExtraBold, fontSize: 22 },
  rankValueLeader: { color: LEADERBOARD_PALETTE.goldInk },
  rankHint: { color: LEADERBOARD_PALETTE.scoreMuted, fontFamily: typography.bodySemibold, fontSize: 10, lineHeight: 14, textAlign: 'right' },
  cardFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 1, minHeight: 36 },
  participantMeta: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  participantTextLight: { color: '#FFFFFF', fontFamily: typography.bodyExtraBold, fontSize: 11 },
  emptyCard: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: 20, borderWidth: 1, gap: 9, padding: 20 },
  emptyIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 16, height: 46, justifyContent: 'center', width: 46 },
  emptyTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 16, textAlign: 'center' },
  errorState: { alignItems: 'center', gap: 12, padding: 22 },
  signInCard: { alignItems: 'center', alignSelf: 'center', backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: 22, borderWidth: 1.5, gap: 10, margin: 16, marginTop: 22, maxWidth: 420, padding: 22, width: '90%' },
  signInIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 17, height: 52, justifyContent: 'center', width: 52 },
  signInTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18, textAlign: 'center' },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, textAlign: 'center' },
  retryButton: { alignItems: 'center', backgroundColor: theme.violetDeep, borderRadius: 12, justifyContent: 'center', minHeight: 42, minWidth: 120, paddingHorizontal: 14 },
  retryText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 12 },
}));
