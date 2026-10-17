import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { getEquippedAvatar, useAvatars } from '@/features/avatars/hooks/useAvatars';
import { getEquippedAppearance, useAppearance } from '@/features/appearance/hooks/useAppearance';
import { useTranslation } from '@/core/i18n/useTranslation';
import { LevelProgressHeader } from '@/features/gamification/achievements/components/LevelProgressHeader';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { useMilestones } from '@/features/gamification/shared/hooks/useMilestones';
import { WeekFootprintCard } from '@/features/gamification/shared';
import type { Milestone } from '@/features/gamification/shared/types/milestone';
import { getUnlockedPegCount } from '@/features/number-peg/utils/numberPegMap';
import { usePalaceScenes } from '@/features/palace-scenes/hooks/usePalaceScenes';
import { usePracticeStats } from '@/features/practice-attempts';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { typography } from '@/theme/typography';
import { memopalThemes } from '@/theme/memopalTheme';
import { ArrowRight, BookOpen, Check, History, Sparkles } from '@/core/icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
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
type AchievementTranslate = (
  key:
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
    | 'wordsTwentyBody'
) => string;

export default function AchievementsScreen() {
  const { styles } = useStyles();
  const router = useRouter();
  const { t } = useTranslation('achievements');
  const { language, t: homeT } = useTranslation('home');
  const { user, isLoading: userLoading, refetch: refetchUser } = useCurrentUser();
  const { milestones, isLoading: milestonesLoading, refetch: refetchMilestones } = useMilestones();
  const totalXp = Math.max(0, user?.totalXp ?? 0);
  const {
    levelInfo,
    isLoading: levelLoading,
    refetch: refetchLevel,
  } = useLevelByXp(totalXp, user?.level);
  const { avatars, refetch: refetchAvatars } = useAvatars();
  const { items: appearanceItems, refetch: refetchAppearance } = useAppearance();
  const { data: practiceStats, refetch: refetchPracticeStats } = usePracticeStats();
  const palaceScenes = usePalaceScenes();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [milestoneFilter, setMilestoneFilter] = useState<MilestoneFilter>('inProgress');
  const [selectedActivityDate, setSelectedActivityDate] = useState<string | undefined>();
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

  const milestoneProgress = useMemo(
    () =>
      milestones
        .map((milestone) =>
          toMilestoneProgress(milestone, {
            level: displayLevel.currentLevel,
            sessions: practiceStats?.sessionsCompleted ?? 0,
            words: practiceStats?.wordsLearned ?? 0,
            currentStreak: user?.stats?.currentStreak ?? 0,
            longestStreak: user?.stats?.longestStreak ?? 0,
            totalXp,
          })
        )
        .sort((left, right) => {
          if (Boolean(left.achievedAt) !== Boolean(right.achievedAt))
            return left.achievedAt ? 1 : -1;
          return right.percent - left.percent;
        }),
    [displayLevel.currentLevel, milestones, practiceStats, totalXp, user?.stats]
  );

  const filteredMilestones = useMemo(() => {
    const filtered =
      milestoneFilter === 'earned'
        ? milestoneProgress.filter((milestone) => Boolean(milestone.achievedAt))
        : milestoneFilter === 'inProgress'
          ? milestoneProgress.filter((milestone) => !milestone.achievedAt)
          : milestoneProgress;
    return filtered;
  }, [milestoneFilter, milestoneProgress]);

  const currentAvatar = getEquippedAvatar(
    avatars,
    user?.selectedAvatarId,
    displayLevel.currentLevel
  );
  const currentAppearance = getEquippedAppearance(
    appearanceItems,
    user?.selectedAvatarFrameId,
    user?.selectedAvatarDecorationId,
    user?.selectedAvatarOutfitId,
    displayLevel.currentLevel
  );
  const nextMilestone = milestoneProgress.find((milestone) => !milestone.achievedAt);
  const milestonesForGrid = filteredMilestones.filter(
    (milestone) => milestone.id !== nextMilestone?.id
  );

  const unlockedPegs = getUnlockedPegCount(displayLevel.currentLevel);
  const palaceTotal = palaceScenes.data?.length ?? 0;
  const palaceUnlocked =
    palaceScenes.data?.filter((scene) => !scene.isPremium || Boolean(user?.isPremium)).length ?? 0;
  const weeklyActivity = practiceStats?.weeklyActivity ?? [];
  const selectedActivity =
    weeklyActivity.find((day) => day.date === selectedActivityDate) ??
    [...weeklyActivity].reverse().find((day) => day.sessions > 0);
  const weekFooterText = selectedActivity
    ? `${new Date(`${selectedActivity.date.slice(0, 10)}T12:00:00`).toLocaleDateString(
        language === 'zh' ? 'zh-CN' : 'en-US',
        { month: 'short', day: 'numeric' }
      )} · ${selectedActivity.sessions} ${homeT('practiceSessions')}`
    : t('weekEmpty');

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
  }, [
    palaceScenes,
    refetchAppearance,
    refetchAvatars,
    refetchLevel,
    refetchMilestones,
    refetchPracticeStats,
    refetchUser,
  ]);

  if (userLoading || milestonesLoading || levelLoading) {
    return <LoadingView description={t('loading')} />;
  }

  return (
    <View
      style={[
        styles.page,
        { backgroundColor: colorScheme === 'dark' ? activeTheme.canvas : '#FAF9FF' },
      ]}>
      <CommonHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        hideBackButton
        showAiCredits
        actions={[
          {
            icon: History,
            onPress: () => router.push('/rewards-history'),
            accessibilityLabel: t('openHistory'),
          },
        ]}
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
          cardStyle={styles.levelHeaderSpacing}
        />

        <WeekFootprintCard
          title={t('weekTrail')}
          activity={weeklyActivity}
          footerText={weekFooterText}
          selectedDate={selectedActivityDate ?? selectedActivity?.date}
          onSelectDate={setSelectedActivityDate}
        />

        <View style={styles.learningOverview}>
          <Text style={styles.sectionLabel}>{t('learningOverview')}</Text>
          <View style={styles.learningStats}>
            <SnapshotMetric
              value={practiceStats?.sessionsCompleted ? `${practiceStats.sessionsCompleted}` : '0'}
              label={t('sessionsDone')}
              icon={Check}
              color="#D5648B"
            />
            <SnapshotMetric
              value={practiceStats?.wordsLearned ? `${practiceStats.wordsLearned}` : '0'}
              label={t('wordsLearned')}
              icon={BookOpen}
              color="#4E9D8D"
            />
            <SnapshotMetric
              value={practiceStats?.sessionsCompleted
                ? `${practiceStats.firstAttemptRecallPercent}%`
                : '—'}
              label={t('firstTryRecall')}
              icon={Sparkles}
              color="#7558D8"
            />
          </View>
        </View>

        {nextMilestone ? (
          <NextWinCard milestone={nextMilestone} onPress={() => router.push('/(tabs)/practice')} />
        ) : null}

        <SectionHeading title={t('learningPaths')} subtitle={t('learningPathsSummary')} />
        <View style={styles.pathRow}>
          <PathTile
            title={t('pegProgress')}
            value={`${unlockedPegs}/100`}
            percent={unlockedPegs}
            color={activeTheme.violetDeep}
            onPress={() => router.push('/number-peg/map')}
          />
          <PathTile
            title={t('palaceProgress')}
            value={`${palaceUnlocked}/${palaceTotal || '—'}`}
            percent={palaceTotal ? (palaceUnlocked / palaceTotal) * 100 : 0}
            color={activeTheme.sky}
            isComplete={palaceTotal > 0 && palaceUnlocked === palaceTotal}
            onPress={() => router.push('/palaces/map')}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeadingCopy}>
            <Text style={[styles.sectionLabel, { color: activeTheme.ink }]}>{t('milestones')}</Text>
            <Text style={[styles.sectionBody, { color: activeTheme.inkSoft }]}>
              {t('milestonesBody')}
            </Text>
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
              <Text
                style={[
                  styles.filterChipText,
                  milestoneFilter === filter && styles.filterChipTextActive,
                ]}>
                {filter === 'inProgress'
                  ? t('inProgress')
                  : filter === 'earned'
                    ? t('earnedFilter')
                    : t('all')}
              </Text>
            </AnimatedPressable>
          ))}
        </View>

        {milestonesForGrid.length ? (
          <View style={styles.milestoneGrid}>
            {milestonesForGrid.map((milestone) => (
              <MilestoneGridCard
                key={milestone.id}
                milestone={milestone}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyMilestones}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>{t('milestonesStart')}</Text>
            <Text style={styles.emptyBody}>{t('milestonesStartBody')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function NextWinCard({
  milestone,
  onPress,
}: {
  milestone: MilestoneProgress;
  onPress: () => void;
}) {
  const { styles } = useStyles();
  const { t } = useTranslation('achievements');
  const copy = getMilestoneCopy(milestone, t);
  const actionText = getNextWinAction(milestone, copy.title, t);
  return (
    <AnimatedPressable lively onPress={onPress} style={styles.nextWinCard}>
      <LinearGradient
        colors={['#FF9147', '#F05D86']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.nextWinTopRow}>
        <View style={styles.nextWinIcon}>
          <Sparkles color="#FFFFFF" size={19} />
        </View>
        <View style={styles.nextWinCopy}>
          <Text style={styles.nextWinEyebrow}>{t('nextWin')}</Text>
          <Text numberOfLines={1} style={styles.nextWinTitle}>
            {actionText}
          </Text>
        </View>
        <ArrowRight color="#FFFFFF" size={18} />
      </View>
      <View style={styles.nextWinProgressRow}>
        <View style={styles.nextWinTrack}>
          <View style={[styles.nextWinFill, { width: `${milestone.percent}%` }]} />
        </View>
        <Text style={styles.nextWinProgressText}>{milestone.percent}%</Text>
        <View style={styles.practicePill}>
          <Text style={styles.practiceNow}>{t('practiceNow')}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

function getNextWinAction(
  milestone: MilestoneProgress,
  title: string,
  t: (key: 'nextWinStreak' | 'nextWinPractice' | 'nextWinWords' | 'nextWinXp' | 'nextWinLevel' | 'nextWinGeneric', values?: Record<string, string | number>) => string
) {
  const values = {
    count: milestone.conditionType === 'level' ? milestone.conditionValue : milestone.remaining,
    title,
  };
  switch (milestone.conditionType) {
    case 'streak_days':
    case 'longest_streak':
      return t('nextWinStreak', values);
    case 'lessons_completed':
      return t('nextWinPractice', values);
    case 'words_learned':
      return t('nextWinWords', values);
    case 'xp_earned':
      return t('nextWinXp', values);
    case 'level':
      return t('nextWinLevel', values);
    default:
      return t('nextWinGeneric', values);
  }
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
  }
): MilestoneProgress {
  const currentValue = (() => {
    switch (milestone.conditionType) {
      case 'level':
        return values.level;
      case 'lessons_completed':
        return values.sessions;
      case 'words_learned':
        return values.words;
      case 'streak_days':
        return values.currentStreak;
      case 'longest_streak':
        return values.longestStreak;
      case 'xp_earned':
        return values.totalXp;
      default:
        return 0;
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

function MilestoneGridCard({ milestone }: { milestone: MilestoneProgress }) {
  const { styles } = useStyles();
  const { t } = useTranslation('achievements');
  const achieved = Boolean(milestone.achievedAt);
  const copy = getMilestoneCopy(milestone, t);

  return (
    <View
      style={[
        styles.milestoneGridCard,
        achieved && styles.milestoneCardAchieved,
      ]}>
      <View style={styles.milestoneGridTop}>
        <View style={[styles.milestoneGridIcon, achieved && styles.milestoneIconAchieved]}>
          <Text style={styles.milestoneEmoji}>{milestoneEmoji(milestone)}</Text>
        </View>
        <Text
          numberOfLines={1}
          style={[styles.milestoneGridStatus, achieved && styles.milestoneStatusAchieved]}>
          {achieved ? t('achieved') : t('milestoneRemaining', { count: milestone.remaining })}
        </Text>
      </View>
      <Text numberOfLines={2} style={styles.milestoneGridTitle}>
        {copy.title}
      </Text>
      <View style={styles.milestoneTrack}>
        <View
          style={[
            styles.milestoneFill,
            achieved && styles.milestoneFillAchieved,
            { width: `${milestone.percent}%` },
          ]}
        />
      </View>
    </View>
  );
}

function SnapshotMetric({
  value,
  label,
  icon: Icon,
  color,
}: {
  value: string;
  label: string;
  icon: typeof Sparkles;
  color: string;
}) {
  const { styles } = useStyles();
  return (
    <View style={styles.snapshotMetric}>
      <View style={[styles.snapshotIcon, { backgroundColor: `${color}18` }]}>
        <Icon size={13} color={color} />
      </View>
      <Text style={styles.snapshotMetricValue}>{value}</Text>
      <Text numberOfLines={1} style={styles.snapshotMetricLabel}>
        {label}
      </Text>
    </View>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  const { styles } = useStyles();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeadingCopy}>
        <Text style={styles.sectionLabel}>{title}</Text>
        <Text style={styles.sectionBody}>{subtitle}</Text>
      </View>
    </View>
  );
}

function PathTile({
  title,
  value,
  percent,
  color,
  isComplete = false,
  onPress,
}: {
  title: string;
  value: string;
  percent: number;
  color: string;
  isComplete?: boolean;
  onPress: () => void;
}) {
  const { styles } = useStyles();
  const { t } = useTranslation('achievements');
  return (
    <AnimatedPressable accessibilityRole="button" onPress={onPress} style={styles.pathTile}>
      <View style={styles.pathTileTop}>
        <ProgressRing percent={percent} color={color} isComplete={isComplete} />
      </View>
      <Text numberOfLines={1} style={styles.pathTitle}>
        {title}
      </Text>
      <View style={styles.pathValueRow}>
        <Text style={[styles.pathValue, { color }]}>{value}</Text>
        {isComplete ? <Text style={styles.pathComplete}>{t('pathComplete')}</Text> : null}
      </View>
    </AnimatedPressable>
  );
}

function ProgressRing({ percent, color, isComplete }: { percent: number; color: string; isComplete: boolean }) {
  const { styles, theme } = useStyles();
  const radius = 27;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, percent));

  return (
    <View style={styles.pathRing}>
      <Svg width={64} height={64} viewBox="0 0 64 64" accessibilityElementsHidden>
        <SvgCircle cx={32} cy={32} r={radius} fill="none" stroke={theme.line} strokeWidth={6} />
        <SvgCircle
          cx={32}
          cy={32}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress / 100)}
          rotation={-90}
          origin="32, 32"
        />
      </Svg>
      <View style={styles.pathRingCenter}>
        {isComplete ? (
          <Check color={color} size={18} strokeWidth={3} />
        ) : (
          <Text style={[styles.pathRingText, { color }]}>{Math.round(progress)}%</Text>
        )}
      </View>
    </View>
  );
}

function getMilestoneCopy(milestone: Milestone, t: AchievementTranslate) {
  switch (milestone.key) {
    case 'first_recall':
      return { title: t('firstRecallTitle'), description: t('firstRecallBody') };
    case 'practice_5':
      return { title: t('practiceFiveTitle'), description: t('practiceFiveBody') };
    case 'words_20':
      return { title: t('wordsTwentyTitle'), description: t('wordsTwentyBody') };
    case 'streak_3':
      return { title: t('streakThreeTitle'), description: t('streakThreeBody') };
    case 'level_5':
      return { title: t('levelFiveTitle'), description: t('levelFiveBody') };
    default:
      return { title: milestone.title, description: milestone.description };
  }
}

function milestoneEmoji(milestone: Milestone) {
  if (milestone.key === 'first_recall') return '🎯';
  if (milestone.key === 'practice_5') return '🏅';
  if (milestone.key === 'streak_3') return '🔥';
  if (milestone.key === 'words_20') return '📚';
  if (milestone.key === 'level_5') return '🏆';
  if (milestone.conditionType.includes('streak')) return '🔥';
  if (milestone.conditionType === 'level') return '🏆';
  if (milestone.conditionType === 'words_learned') return '📚';
  if (milestone.conditionType.includes('xp')) return '⭐';
  return '🧠';
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    page: { flex: 1 },
    content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40, gap: 16 },
    levelHeaderSpacing: { marginBottom: 0 },
    learningOverview: { gap: 9 },
    learningStats: { flexDirection: 'row', alignItems: 'stretch', gap: 9 },
    snapshotMetric: { flex: 1, minWidth: 0, minHeight: 88, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 15, backgroundColor: theme.paper, borderWidth: 1, borderColor: theme.line },
    snapshotIcon: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginBottom: 2 },
    snapshotMetricValue: {
      color: theme.ink,
      fontFamily: typography.displayExtraBold,
      fontSize: 16,
    },
    snapshotMetricLabel: { color: theme.inkMuted, fontFamily: typography.bodyBold, fontSize: 8, textAlign: 'center' },
    nextWinCard: {
      padding: 13,
      borderRadius: 20,
      borderWidth: 0,
      overflow: 'hidden',
      boxShadow: '0px 6px 16px rgba(239,94,127,0.24)',
    },
    nextWinTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    nextWinIcon: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    nextWinCopy: { flex: 1, minWidth: 0 },
    nextWinEyebrow: {
      color: 'rgba(255,255,255,0.88)',
      fontFamily: typography.bodyExtraBold,
      fontSize: 9,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    nextWinTitle: {
      color: '#FFFFFF',
      fontFamily: typography.displayExtraBold,
      fontSize: 14,
      marginTop: 2,
    },
    nextWinProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 },
    nextWinTrack: {
      flex: 1,
      height: 7,
      overflow: 'hidden',
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.32)',
    },
    nextWinFill: { height: '100%', borderRadius: 999, backgroundColor: '#FFFFFF' },
    nextWinProgressText: {
      color: '#FFFFFF',
      fontFamily: typography.bodyExtraBold,
      fontSize: 10,
    },
    practicePill: { borderRadius: 999, backgroundColor: '#FFFFFF', paddingHorizontal: 11, paddingVertical: 7 },
    practiceNow: { color: '#D64A2A', fontFamily: typography.bodyExtraBold, fontSize: 10 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 2,
      marginBottom: -6,
    },
    sectionHeadingCopy: { flex: 1, gap: 2 },
    sectionLabel: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 17 },
    sectionBody: {
      color: theme.inkSoft,
      fontFamily: typography.bodyBold,
      fontSize: 11,
      marginTop: 2,
    },
    achievedPill: {
      borderRadius: 999,
      backgroundColor: theme.mintTint,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    achievedPillText: {
      color: theme.successText,
      fontFamily: typography.bodyExtraBold,
      fontSize: 10,
    },
    filterRow: { flexDirection: 'row', gap: 7, marginBottom: 11 },
    filterChip: {
      minHeight: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: theme.line,
      backgroundColor: theme.paper,
      paddingHorizontal: 13,
    },
    filterChipActive: { borderColor: theme.violetDeep, backgroundColor: theme.violetDeep },
    filterChipText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10.5 },
    filterChipTextActive: { color: theme.onAccent },
    milestoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    milestoneGridCard: {
      width: '47%',
      minHeight: 136,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1.3,
      borderColor: theme.line,
      backgroundColor: theme.paper,
      justifyContent: 'space-between',
      boxShadow: '0px 4px 14px rgba(80,50,180,0.08)',
    },
    milestoneGridTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    milestoneGridIcon: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    milestoneGridStatus: {
      color: theme.violetDeep,
      fontFamily: typography.bodyExtraBold,
      fontSize: 10,
    },
    milestoneGridTitle: {
      color: theme.ink,
      fontFamily: typography.displayExtraBold,
      fontSize: 14,
      lineHeight: 19,
      marginTop: 6,
    },
    milestoneCardAchieved: { borderColor: theme.line, backgroundColor: theme.paper },
    milestoneIconAchieved: { backgroundColor: 'transparent' },
    milestoneEmoji: { fontSize: 28 },
    milestoneStatusAchieved: { color: theme.successText },
    milestoneTrack: {
      height: 6,
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: theme.line,
      marginTop: 8,
    },
    milestoneFill: { height: '100%', borderRadius: 999, backgroundColor: theme.violet },
    milestoneFillAchieved: { backgroundColor: theme.grass },
    emptyMilestones: {
      alignItems: 'center',
      borderRadius: 18,
      borderWidth: 2,
      borderColor: theme.line,
      backgroundColor: theme.paper,
      padding: 22,
    },
    emptyEmoji: { fontSize: 28 },
    emptyTitle: {
      color: theme.ink,
      fontFamily: typography.displayExtraBold,
      fontSize: 14,
      marginTop: 8,
    },
    emptyBody: {
      color: theme.inkSoft,
      fontFamily: typography.bodyBold,
      fontSize: 11,
      textAlign: 'center',
      marginTop: 4,
    },
    pathRow: { flexDirection: 'row', gap: 10 },
    pathTile: {
      flex: 1,
      minHeight: 138,
      borderRadius: 20,
      padding: 16,
      backgroundColor: theme.paper,
      boxShadow: '0px 4px 14px rgba(80,50,180,0.08)',
    },
    pathTileTop: { flexDirection: 'row', alignItems: 'center' },
    pathRing: {
      width: 64,
      height: 64,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pathRingCenter: {
      position: 'absolute',
      inset: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pathRingText: { fontFamily: typography.bodyExtraBold, fontSize: 12 },
    pathTitle: {
      color: theme.ink,
      fontFamily: typography.displayExtraBold,
      fontSize: 14,
      marginTop: 8,
    },
    pathValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    pathValue: { fontFamily: typography.bodyExtraBold, fontSize: 14 },
    pathComplete: { color: theme.successText, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  })
);
