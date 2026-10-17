import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { getEquippedAvatar, useAvatars } from '@/features/avatars/hooks/useAvatars';
import { getEquippedAppearance, useAppearance } from '@/features/appearance/hooks/useAppearance';
import { useTranslation } from '@/core/i18n/useTranslation';
import { LevelProgressHeader } from '@/features/gamification/achievements/components/LevelProgressHeader';
import { WeeklyActivityCard } from '@/features/gamification/shared/components/WeeklyActivityCard';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { useMilestones } from '@/features/gamification/shared/hooks/useMilestones';
import type { Milestone } from '@/features/gamification/shared/types/milestone';
import { getUnlockedPegCount } from '@/features/number-peg/utils/numberPegMap';
import { usePalaceScenes } from '@/features/palace-scenes/hooks/usePalaceScenes';
import { usePracticeStats } from '@/features/practice-attempts';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { typography } from '@/theme/typography';
import { memopalThemes } from '@/theme/memopalTheme';
import { ArrowRight, Building2, Check, Hash, History, Sparkles } from '@/core/icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';

type MilestoneProgress = Milestone & {
  currentValue: number;
  percent: number;
  remaining: number;
};

type MilestoneFilter = 'inProgress' | 'earned' | 'all';
type AchievementTranslate = (key:
  | 'avatarApprentice'
  | 'avatarArchitect'
  | 'avatarExplorer'
  | 'avatarNavigator'
  | 'avatarSage'
  | 'firstRecallTitle'
  | 'firstRecallBody'
  | 'levelFiveTitle'
  | 'levelFiveBody'
  | 'practiceFiveTitle'
  | 'practiceFiveBody'
  | 'streakThreeTitle'
  | 'streakThreeBody'
  | 'wordsTwentyTitle'
  | 'wordsTwentyBody') => string;

export default function AchievementsScreen() {
  const { styles } = useStyles();
  const router = useRouter();
  const { t } = useTranslation('achievements');
  const { user, isLoading: userLoading, refetch: refetchUser } = useCurrentUser();
  const { milestones, isLoading: milestonesLoading, refetch: refetchMilestones } = useMilestones();
  const totalXp = Math.max(0, user?.totalXp ?? 0);
  const { levelInfo, isLoading: levelLoading, refetch: refetchLevel } = useLevelByXp(totalXp, user?.level);
  const { avatars, refetch: refetchAvatars } = useAvatars();
  const { items: appearanceItems, refetch: refetchAppearance } = useAppearance();
  const { data: practiceStats, refetch: refetchPracticeStats } = usePracticeStats();
  const palaceScenes = usePalaceScenes();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [milestoneFilter, setMilestoneFilter] = useState<MilestoneFilter>('inProgress');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];

  const displayLevel = useMemo(() => {
    const currentLevel = Math.max(1, levelInfo?.currentLevel ?? user?.level ?? 1);
    return {
      currentLevel,
      xpInCurrentLevel: Math.max(0, levelInfo?.xpInCurrentLevel ?? totalXp % 100),
      xpToNextLevel: Math.max(1, levelInfo?.xpToNextLevel ?? 100),
      totalXp,
      title: levelInfo?.currentLevelConfig?.title ?? t('memoryExplorer'),
      titleZh: levelInfo?.currentLevelConfig?.titleZh,
    };
  }, [levelInfo, t, totalXp, user?.level]);

  const milestoneProgress = useMemo(() => milestones
    .map((milestone) => toMilestoneProgress(milestone, {
      level: displayLevel.currentLevel,
      sessions: practiceStats?.sessionsCompleted ?? 0,
      words: practiceStats?.wordsLearned ?? 0,
      currentStreak: user?.stats?.currentStreak ?? 0,
      longestStreak: user?.stats?.longestStreak ?? 0,
      totalXp,
    }))
    .sort((left, right) => {
      if (Boolean(left.achievedAt) !== Boolean(right.achievedAt)) return left.achievedAt ? 1 : -1;
      return right.percent - left.percent;
    }), [displayLevel.currentLevel, milestones, practiceStats, totalXp, user?.stats]);

  const visibleMilestones = useMemo(() => {
    const filtered = milestoneFilter === 'earned'
      ? milestoneProgress.filter((milestone) => Boolean(milestone.achievedAt))
      : milestoneFilter === 'inProgress'
        ? milestoneProgress.filter((milestone) => !milestone.achievedAt)
        : milestoneProgress;
    return filtered.slice(0, 8);
  }, [milestoneFilter, milestoneProgress]);

  const currentAvatar = getEquippedAvatar(avatars, user?.selectedAvatarId, displayLevel.currentLevel);
  const currentAppearance = getEquippedAppearance(
    appearanceItems,
    user?.selectedAvatarFrameId,
    user?.selectedAvatarDecorationId,
    user?.selectedAvatarOutfitId,
    displayLevel.currentLevel,
  );
  const nextMilestone = milestoneProgress.find((milestone) => !milestone.achievedAt) ?? milestoneProgress[0];

  const unlockedPegs = getUnlockedPegCount(displayLevel.currentLevel);
  const palaceTotal = palaceScenes.data?.length ?? 0;
  const palaceUnlocked = palaceScenes.data?.filter(
    (scene) => !scene.isPremium || Boolean(user?.isPremium),
  ).length ?? 0;

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        refetchUser(),
        refetchMilestones(),
        refetchLevel(),
        refetchPracticeStats(),
        palaceScenes.refetch(),
        refetchAvatars(),
        refetchAppearance(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [palaceScenes, refetchAppearance, refetchAvatars, refetchLevel, refetchMilestones, refetchPracticeStats, refetchUser]);

  if (userLoading || milestonesLoading || levelLoading) {
    return <LoadingView description={t('loading')} />;
  }

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        hideBackButton
        actions={[{
          icon: History,
          onPress: () => router.push('/rewards-history'),
          accessibilityLabel: t('openHistory'),
        }]}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        <LevelProgressHeader
          avatar={currentAvatar}
          appearance={currentAppearance}
          level={displayLevel}
          streak={user?.stats?.currentStreak ?? 0}
        />

        <View style={styles.statRow}>
          <StatTile value={`${practiceStats?.sessionsCompleted ?? 0}`} label={t('sessionsDone')} />
          <StatTile value={`${practiceStats?.wordsLearned ?? 0}`} label={t('wordsLearned')} />
          <StatTile value={`${practiceStats?.firstAttemptRecallPercent ?? 0}%`} label={t('firstTryRecall')} />
        </View>

        {nextMilestone ? (
          <NextWinCard
            milestone={nextMilestone}
            onPress={() => router.push('/(tabs)/practice')}
          />
        ) : null}

        <WeeklyActivityCard title={t('weekActivity')} activity={practiceStats?.weeklyActivity} />

        <ProgressLine
          label={t('pegProgress')}
          value={`${unlockedPegs} / 100 ${t('pegsUnlocked')}`}
          percent={(unlockedPegs / 100) * 100}
          color={activeTheme.violetDeep}
          icon={Hash}
          description={t('numberPeg')}
          onPress={() => router.push('/number-peg/map')}
        />
        <ProgressLine
          label={t('palaceProgress')}
          value={`${palaceUnlocked} / ${Math.max(1, palaceTotal)} ${t('palacesUnlocked')}`}
          percent={palaceTotal ? (palaceUnlocked / palaceTotal) * 100 : 0}
          color={activeTheme.sky}
          icon={Building2}
          description={t('memoryPalace')}
          onPress={() => router.push('/palaces/map')}
        />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionLabel, { color: activeTheme.ink }]}>{t('milestones')}</Text>
            <Text style={[styles.sectionBody, { color: activeTheme.inkSoft }]}>{t('milestonesBody')}</Text>
          </View>
          <View style={styles.achievedPill}>
            <Text style={styles.achievedPillText}>
              {milestones.filter((item) => Boolean(item.achievedAt)).length} {t('achieved')}
            </Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {(['inProgress', 'earned', 'all'] as const).map((filter) => (
            <AnimatedPressable
              accessibilityRole="tab"
              accessibilityState={{ selected: milestoneFilter === filter }}
              key={filter}
              onPress={() => setMilestoneFilter(filter)}
              style={[styles.filterChip, milestoneFilter === filter && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, milestoneFilter === filter && styles.filterChipTextActive]}>
                {filter === 'inProgress' ? t('inProgress') : filter === 'earned' ? t('earnedFilter') : t('all')}
              </Text>
            </AnimatedPressable>
          ))}
        </View>

        <View style={styles.milestoneList}>
          {visibleMilestones.map((milestone) => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
          ))}
          {visibleMilestones.length === 0 ? (
            <View style={styles.emptyMilestones}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>{t('milestonesStart')}</Text>
              <Text style={styles.emptyBody}>{t('milestonesStartBody')}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function NextWinCard({ milestone, onPress }: { milestone: MilestoneProgress; onPress: () => void }) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('achievements');
  const copy = getMilestoneCopy(milestone, t);
  return (
    <AnimatedPressable lively onPress={onPress} style={styles.nextWinCard}>
      <View style={styles.nextWinTopRow}>
        <View style={styles.nextWinIcon}>
          <Sparkles color={theme.violetDeep} size={19} />
        </View>
        <View style={styles.nextWinCopy}>
          <Text style={styles.nextWinEyebrow}>{t('nextWin')}</Text>
          <Text numberOfLines={1} style={styles.nextWinTitle}>{copy.title}</Text>
          <Text numberOfLines={1} style={styles.nextWinBody}>{copy.description}</Text>
        </View>
        <ArrowRight color={theme.violetDeep} size={18} />
      </View>
      <View style={styles.nextWinProgressRow}>
        <View style={styles.nextWinTrack}>
          <View style={[styles.nextWinFill, { width: `${milestone.percent}%` }]} />
        </View>
        <Text style={styles.nextWinProgressText}>{milestone.percent}%</Text>
        <Text style={styles.practiceNow}>{t('practiceNow')}</Text>
      </View>
    </AnimatedPressable>
  );
}

function toMilestoneProgress(
  milestone: Milestone,
  values: {
    level: number;
    sessions: number;
    words: number;
    currentStreak: number;
    longestStreak: number;
    totalXp: number;
  },
): MilestoneProgress {
  const currentValue = (() => {
    switch (milestone.conditionType) {
      case 'level': return values.level;
      case 'lessons_completed': return values.sessions;
      case 'words_learned': return values.words;
      case 'streak_days': return values.currentStreak;
      case 'longest_streak': return values.longestStreak;
      case 'xp_earned': return values.totalXp;
      default: return 0;
    }
  })();
  const target = Math.max(1, milestone.conditionValue);
  return {
    ...milestone,
    currentValue,
    percent: milestone.achievedAt ? 100 : Math.min(100, Math.round((currentValue / target) * 100)),
    remaining: Math.max(0, target - currentValue),
  };
}

function MilestoneCard({ milestone }: { milestone: MilestoneProgress }) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('achievements');
  const achieved = Boolean(milestone.achievedAt);
  const localizedCopy = getMilestoneCopy(milestone, t);
  return (
    <View style={[styles.milestoneCard, achieved && styles.milestoneCardAchieved]}>
      <View style={[styles.milestoneIcon, achieved && styles.milestoneIconAchieved]}>
        {achieved ? <Check size={20} color={theme.successText} strokeWidth={3} /> : <Text style={styles.milestoneEmoji}>{milestoneEmoji(milestone)}</Text>}
      </View>
      <View style={styles.milestoneCopy}>
        <View style={styles.milestoneTopRow}>
          <Text numberOfLines={1} style={styles.milestoneTitle}>{localizedCopy.title}</Text>
          <Text style={[styles.milestoneStatus, achieved && styles.milestoneStatusAchieved]}>
            {achieved ? t('achieved') : `${milestone.remaining} ${t('toGo')}`}
          </Text>
        </View>
        {localizedCopy.description ? <Text numberOfLines={2} style={styles.milestoneDescription}>{localizedCopy.description}</Text> : null}
        <View style={styles.milestoneTrack}>
          <View style={[styles.milestoneFill, achieved && styles.milestoneFillAchieved, { width: `${milestone.percent}%` }]} />
        </View>
      </View>
    </View>
  );
}

function getMilestoneCopy(milestone: Milestone, t: AchievementTranslate) {
  switch (milestone.key) {
    case 'first_recall': return { title: t('firstRecallTitle'), description: t('firstRecallBody') };
    case 'practice_5': return { title: t('practiceFiveTitle'), description: t('practiceFiveBody') };
    case 'words_20': return { title: t('wordsTwentyTitle'), description: t('wordsTwentyBody') };
    case 'streak_3': return { title: t('streakThreeTitle'), description: t('streakThreeBody') };
    case 'level_5': return { title: t('levelFiveTitle'), description: t('levelFiveBody') };
    default: return { title: milestone.title, description: milestone.description };
  }
}

function milestoneEmoji(milestone: Milestone) {
  if (milestone.conditionType.includes('streak')) return '🔥';
  if (milestone.conditionType === 'level') return '🏆';
  if (milestone.conditionType === 'words_learned') return '📚';
  if (milestone.conditionType.includes('xp')) return '⭐';
  return '🧠';
}

function StatTile({ value, label }: { value: string; label: string }) {
  const { styles } = useStyles();
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProgressLine({
  label,
  value,
  percent,
  color,
  icon: Icon,
  description,
  onPress,
}: {
  label: string;
  value: string;
  percent: number;
  color: string;
  icon: typeof Hash;
  description: string;
  onPress: () => void;
}) {
  const { styles } = useStyles();
  const { t } = useTranslation('achievements');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const roundedPercent = Math.round(Math.min(100, Math.max(0, percent)));
  return (
    <View style={[styles.progressLine, { borderColor: activeTheme.line }]}>
      <View style={styles.progressLineHeader}>
        <View style={styles.progressTitleGroup}>
          <View style={[styles.progressIcon, { backgroundColor: `${color}18` }]}><Icon size={18} color={color} strokeWidth={2.5} /></View>
          <View style={styles.progressTitleCopy}><Text style={[styles.progressSectionLabel, { color: activeTheme.ink }]}>{label}</Text><Text style={[styles.progressDescription, { color: activeTheme.inkSoft }]}>{description}</Text></View>
        </View>
        <View style={[styles.progressPercent, { backgroundColor: `${color}18` }]}><Text style={[styles.progressPercentText, { color }]}>{roundedPercent}%</Text></View>
      </View>
      <View style={styles.progressMetricRow}>
        <Text style={[styles.progressLabel, { color: activeTheme.ink }]}>{value}</Text>
        <AnimatedPressable accessibilityLabel={`${t('seeAll')} ${label}`} onPress={onPress} style={styles.seeAll}>
          <View style={styles.seeAllRow}>
            <Text style={[styles.seeAllText, { color: activeTheme.link }]}>{t('seeAll')}</Text>
            <ArrowRight size={12} color={activeTheme.link} />
          </View>
        </AnimatedPressable>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: activeTheme.line }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: roundedPercent }}>
        <View style={[styles.progressFill, { width: `${roundedPercent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingBottom: 128 },
  statRow: { flexDirection: 'row', gap: 10 },
  statTile: { flex: 1, alignItems: 'center', backgroundColor: theme.paper, borderWidth: 2, borderColor: theme.line, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 6 },
  statValue: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19 },
  statLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10, textAlign: 'center', marginTop: 2 },
  nextWinCard: { marginTop: 14, padding: 15, borderRadius: 22, borderWidth: 1.5, borderColor: theme.violetLine, backgroundColor: theme.paper, boxShadow: '0px 5px 0px rgba(105,80,204,0.08)' },
  nextWinTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nextWinIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: theme.violetTint },
  nextWinCopy: { flex: 1, minWidth: 0 },
  nextWinEyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.7, textTransform: 'uppercase' },
  nextWinTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14, marginTop: 2 },
  nextWinBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10.5, marginTop: 1 },
  nextWinProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13 },
  nextWinTrack: { flex: 1, height: 7, overflow: 'hidden', borderRadius: 999, backgroundColor: theme.violetTint },
  nextWinFill: { height: '100%', borderRadius: 999, backgroundColor: theme.violetDeep },
  nextWinProgressText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  practiceNow: { color: theme.link, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  progressLine: { marginTop: 14, padding: 16, borderRadius: 21, borderWidth: 1.5, backgroundColor: theme.paper, boxShadow: '0px 4px 0px rgba(105,80,204,0.06)' },
  progressLineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  progressTitleGroup: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }, progressIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, progressTitleCopy: { flex: 1, minWidth: 0 },
  progressSectionLabel: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14 }, progressDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, marginTop: 2 }, progressPercent: { minWidth: 48, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, alignItems: 'center' }, progressPercentText: { fontFamily: typography.bodyExtraBold, fontSize: 11 },
  progressMetricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 14 }, progressLabel: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  seeAll: { minHeight: 44, justifyContent: 'center' },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: theme.link, fontFamily: typography.displayExtraBold, fontSize: 11.5 },
  progressTrack: { height: 9, backgroundColor: theme.line, borderRadius: 999, overflow: 'hidden', marginTop: 10 },
  progressFill: { height: '100%', borderRadius: 999 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 25, marginBottom: 11 },
  sectionLabel: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 17 },
  sectionBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, marginTop: 2 },
  achievedPill: { borderRadius: 999, backgroundColor: theme.mintTint, paddingHorizontal: 10, paddingVertical: 6 },
  achievedPillText: { color: theme.successText, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  filterRow: { flexDirection: 'row', gap: 7, marginBottom: 11 },
  filterChip: { minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 999, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 13 },
  filterChipActive: { borderColor: theme.violetDeep, backgroundColor: theme.violetDeep },
  filterChipText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10.5 },
  filterChipTextActive: { color: theme.onAccent },
  milestoneList: { gap: 10 },
  milestoneCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.paper, borderWidth: 2, borderColor: theme.line, borderRadius: 24, padding: 17 },
  milestoneCardAchieved: { borderColor: theme.mintLine, backgroundColor: theme.mintTint },
  milestoneIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: theme.skyTint, alignItems: 'center', justifyContent: 'center' },
  milestoneIconAchieved: { backgroundColor: theme.mintTint },
  milestoneEmoji: { fontSize: 21 },
  milestoneCopy: { flex: 1, minWidth: 0 },
  milestoneTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  milestoneTitle: { flex: 1, color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 13.5 },
  milestoneStatus: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9.5 },
  milestoneStatusAchieved: { color: theme.successText },
  milestoneDescription: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 18, marginTop: 2 },
  milestoneTrack: { height: 6, borderRadius: 999, overflow: 'hidden', backgroundColor: theme.line, marginTop: 8 },
  milestoneFill: { height: '100%', borderRadius: 999, backgroundColor: theme.violet },
  milestoneFillAchieved: { backgroundColor: theme.grass },
  emptyMilestones: { alignItems: 'center', borderRadius: 18, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 22 },
  emptyEmoji: { fontSize: 28 },
  emptyTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14, marginTop: 8 },
  emptyBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, textAlign: 'center', marginTop: 4 },
}));
