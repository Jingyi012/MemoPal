import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
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
import { ArrowRight, Check, History } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

type MilestoneProgress = Milestone & {
  currentValue: number;
  percent: number;
  remaining: number;
};

export default function AchievementsScreen() {
  const router = useRouter();
  const { t } = useTranslation('achievements');
  const { user, isLoading: userLoading, refetch: refetchUser } = useCurrentUser();
  const { milestones, isLoading: milestonesLoading, refetch: refetchMilestones } = useMilestones();
  const totalXp = Math.max(0, user?.totalXp ?? 0);
  const { levelInfo, isLoading: levelLoading, refetch: refetchLevel } = useLevelByXp(totalXp, user?.level);
  const { data: practiceStats, refetch: refetchPracticeStats } = usePracticeStats();
  const palaceScenes = usePalaceScenes();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    })
    .slice(0, 6), [displayLevel.currentLevel, milestones, practiceStats, totalXp, user?.stats]);

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
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [palaceScenes, refetchLevel, refetchMilestones, refetchPracticeStats, refetchUser]);

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
        <LevelProgressHeader level={displayLevel} streak={user?.stats?.currentStreak ?? 0} />

        <View style={styles.statRow}>
          <StatTile value={`${practiceStats?.sessionsCompleted ?? 0}`} label={t('sessionsDone')} />
          <StatTile value={`${practiceStats?.wordsLearned ?? 0}`} label={t('wordsLearned')} />
          <StatTile value={`${practiceStats?.firstAttemptRecallPercent ?? 0}%`} label={t('firstTryRecall')} />
        </View>

        <WeeklyActivityCard title={t('weekActivity')} activity={practiceStats?.weeklyActivity} />

        <ProgressLine
          label={t('pegProgress')}
          value={`${unlockedPegs} / 100 ${t('pegsUnlocked')}`}
          percent={(unlockedPegs / 100) * 100}
          color="#FF6F91"
          onPress={() => router.push('/number-peg/map')}
        />
        <ProgressLine
          label={t('palaceProgress')}
          value={`${palaceUnlocked} / ${Math.max(1, palaceTotal)} ${t('palacesUnlocked')}`}
          percent={palaceTotal ? (palaceUnlocked / palaceTotal) * 100 : 0}
          color="#9B8CFF"
          onPress={() => router.push('/palaces/map')}
        />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionLabel}>{t('milestones')}</Text>
            <Text style={styles.sectionBody}>{t('milestonesBody')}</Text>
          </View>
          <View style={styles.achievedPill}>
            <Text style={styles.achievedPillText}>
              {milestones.filter((item) => Boolean(item.achievedAt)).length} {t('achieved')}
            </Text>
          </View>
        </View>

        <View style={styles.milestoneList}>
          {milestoneProgress.map((milestone) => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
          ))}
          {milestoneProgress.length === 0 ? (
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
  const { t } = useTranslation('achievements');
  const achieved = Boolean(milestone.achievedAt);
  const localizedCopy = (() => {
    switch (milestone.key) {
      case 'first_recall': return { title: t('firstRecallTitle'), description: t('firstRecallBody') };
      case 'practice_5': return { title: t('practiceFiveTitle'), description: t('practiceFiveBody') };
      case 'words_20': return { title: t('wordsTwentyTitle'), description: t('wordsTwentyBody') };
      case 'streak_3': return { title: t('streakThreeTitle'), description: t('streakThreeBody') };
      case 'level_5': return { title: t('levelFiveTitle'), description: t('levelFiveBody') };
      default: return { title: milestone.title, description: milestone.description };
    }
  })();
  return (
    <View style={[styles.milestoneCard, achieved && styles.milestoneCardAchieved]}>
      <View style={[styles.milestoneIcon, achieved && styles.milestoneIconAchieved]}>
        {achieved ? <Check size={20} color="#267A55" strokeWidth={3} /> : <Text style={styles.milestoneEmoji}>{milestoneEmoji(milestone)}</Text>}
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

function milestoneEmoji(milestone: Milestone) {
  if (milestone.conditionType.includes('streak')) return '🔥';
  if (milestone.conditionType === 'level') return '🏆';
  if (milestone.conditionType === 'words_learned') return '📚';
  if (milestone.conditionType.includes('xp')) return '⭐';
  return '🧠';
}

function StatTile({ value, label }: { value: string; label: string }) {
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
  onPress,
}: {
  label: string;
  value: string;
  percent: number;
  color: string;
  onPress: () => void;
}) {
  const { t } = useTranslation('achievements');
  return (
    <View style={styles.progressLine}>
      <View style={styles.progressLineHeader}>
        <Text style={styles.progressSectionLabel}>{label}</Text>
        <AnimatedPressable accessibilityLabel={`${t('seeAll')} ${label}`} onPress={onPress} style={styles.seeAll}>
          <View style={styles.seeAllRow}>
            <Text style={styles.seeAllText}>{t('seeAll')}</Text>
            <ArrowRight size={12} color="#4FC0E8" />
          </View>
        </AnimatedPressable>
      </View>
      <Text style={styles.progressLabel}>{value}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 128 },
  statRow: { flexDirection: 'row', gap: 10 },
  statTile: { flex: 1, alignItems: 'center', backgroundColor: '#FFFDF8', borderWidth: 2, borderColor: '#EEE9DC', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 6 },
  statValue: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 19 },
  statLabel: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 10, textAlign: 'center', marginTop: 2 },
  progressLine: { marginTop: 20 },
  progressLineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  progressSectionLabel: { color: '#6B6A80', fontFamily: typography.displayExtraBold, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase' },
  progressLabel: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 11.5, marginBottom: 6 },
  seeAll: { minHeight: 32, justifyContent: 'center' },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: '#4FC0E8', fontFamily: typography.displayExtraBold, fontSize: 11.5 },
  progressTrack: { height: 9, backgroundColor: '#EEE9DC', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 25, marginBottom: 11 },
  sectionLabel: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 17 },
  sectionBody: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 11, marginTop: 2 },
  achievedPill: { borderRadius: 999, backgroundColor: '#F1FBF5', paddingHorizontal: 10, paddingVertical: 6 },
  achievedPillText: { color: '#267A55', fontFamily: typography.bodyExtraBold, fontSize: 10 },
  milestoneList: { gap: 10 },
  milestoneCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFDF8', borderWidth: 2, borderColor: '#EEE9DC', borderRadius: 18, padding: 13 },
  milestoneCardAchieved: { borderColor: '#BFE7D6', backgroundColor: '#F8FFFB' },
  milestoneIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#EEE9FF', alignItems: 'center', justifyContent: 'center' },
  milestoneIconAchieved: { backgroundColor: '#DDF5E9' },
  milestoneEmoji: { fontSize: 21 },
  milestoneCopy: { flex: 1, minWidth: 0 },
  milestoneTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  milestoneTitle: { flex: 1, color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 13.5 },
  milestoneStatus: { color: '#7A68E0', fontFamily: typography.bodyExtraBold, fontSize: 9.5 },
  milestoneStatusAchieved: { color: '#267A55' },
  milestoneDescription: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  milestoneTrack: { height: 6, borderRadius: 999, overflow: 'hidden', backgroundColor: '#EEE9DC', marginTop: 8 },
  milestoneFill: { height: '100%', borderRadius: 999, backgroundColor: '#9B8CFF' },
  milestoneFillAchieved: { backgroundColor: '#3FB87F' },
  emptyMilestones: { alignItems: 'center', borderRadius: 18, borderWidth: 2, borderColor: '#EEE9DC', backgroundColor: '#FFFDF8', padding: 22 },
  emptyEmoji: { fontSize: 28 },
  emptyTitle: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 14, marginTop: 8 },
  emptyBody: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 11, textAlign: 'center', marginTop: 4 },
});
