import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useAllBadges } from '@/features/gamification/shared/hooks/useBadges';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useGamificationUiConfig } from '@/features/gamification/shared/hooks/useGamificationUiConfig';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { useMilestones } from '@/features/gamification/shared/hooks/useMilestones';
import { useMissions } from '@/features/gamification/shared/hooks/useMissions';
import { useRouter, useLocalSearchParams } from 'expo-router'; // 1. Added useLocalSearchParams
import { History } from 'lucide-react-native';
import React, { useCallback, useMemo, useState, useEffect } from 'react'; // 2. Added useEffect
import { RefreshControl, ScrollView } from 'react-native';
import { BadgeDetailsModal } from '../components/BadgeDetailsModal';
import { AchievementTab, AchievementTabSwitcher } from '../components/AchievementTabSwitcher';
import { BadgesTab } from '../components/BadgesTab';
import { LevelProgressHeader } from '../components/LevelProgressHeader';
import { MilestonesTab } from '../components/MilestonesTab';
import { MissionsTab } from '../components/MissionsTab';
import { OverviewTab } from '../components/OverviewTab';

const AchievementsScreen: React.FC = () => {
  const router = useRouter();

  const { tab } = useLocalSearchParams<{ tab?: AchievementTab }>();

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<AchievementTab>(tab ?? 'overview');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  const handleTabChange = useCallback((newTab: AchievementTab) => {
    setActiveTab(newTab);
  }, []);

  const { user, isLoading: userLoading, refetch: refetchCurrentUser } = useCurrentUser();
  const { badges, isLoading: badgesLoading, refetch: refetchBadges } = useAllBadges();
  const { milestones, isLoading: milestonesLoading, refetch: refetchMilestones } = useMilestones();
  const {
    missions,
    isLoading: missionsLoading,
    isError: missionsLoadError,
    refetch: refetchMissions,
  } = useMissions();

  const totalXp = Math.max(0, user?.totalXp ?? 0);

  const {
    levelInfo,
    isLoading: levelInfoLoading,
    refetch: refetchLevelInfo,
  } = useLevelByXp(totalXp, user?.level);

  const { config: gamificationUiConfig, refetch: refetchGamificationUiConfig } =
    useGamificationUiConfig();

  const isLoading =
    badgesLoading || milestonesLoading || missionsLoading || userLoading || levelInfoLoading;

  const enrichedBadges = useMemo(
    () => badges.map((badge) => ({ ...badge, isEarned: !!badge.earnedAt })),
    [badges]
  );

  const selectedBadge = useMemo(
    () => enrichedBadges.find((badge) => badge.id === selectedBadgeId) ?? null,
    [enrichedBadges, selectedBadgeId]
  );

  const currentMetricValue = useCallback(
    (conditionType: string) => {
      const type = (conditionType || '').toLowerCase();
      switch (type) {
        case 'level':
          return user?.level ?? levelInfo?.currentLevel ?? 1;
        case 'xp_earned':
          return totalXp;
        case 'lessons_completed':
          return user?.stats?.lessonsCompleted ?? 0;
        case 'words_learned':
          return user?.stats?.wordsLearned ?? 0;
        case 'streak_days':
          return user?.stats?.currentStreak ?? 0;
        case 'mastered_lessons':
          return milestones.filter((m) => !!m.achievedAt).length;
        default:
          return 0;
      }
    },
    [levelInfo, milestones, totalXp, user]
  );

  const enrichedMilestones = useMemo(() => {
    return milestones
      .map((milestone) => {
        const targetValue = Math.max(1, milestone.conditionValue ?? 1);
        const currentValue = currentMetricValue(milestone.conditionType);
        const progressPercent = Math.min(100, Math.round((currentValue / targetValue) * 100));

        return {
          ...milestone,
          isLocked: !milestone.achievedAt,
          currentValue,
          targetValue,
          progressPercent,
          remaining: Math.max(0, targetValue - currentValue),
        };
      })
      .sort((a, b) => {
        if (a.isLocked !== b.isLocked) return a.isLocked ? -1 : 1;
        return a.remaining - b.remaining;
      });
  }, [currentMetricValue, milestones]);

  const milestoneGroups = useMemo(() => {
    const groups: Record<string, typeof enrichedMilestones> = {};
    for (const milestone of enrichedMilestones) {
      const key = milestone.conditionType || 'other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(milestone);
    }
    return Object.entries(groups)
      .map(
        ([type, items]) => [type, [...items].sort((a, b) => a.targetValue - b.targetValue)] as const
      )
      .sort(([a], [b]) => a.localeCompare(b));
  }, [enrichedMilestones]);

  const summaryStats = useMemo(() => {
    const activeMissions = missions
      .filter((m) => m.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      totalBadgeEarned: badges.filter((b) => !!b.earnedAt).length,
      totalMilestonesAchieved: milestones.filter((m) => !!m.achievedAt).length,
      activeMissions,
      completedMissionsCount: activeMissions.filter((m) => m.isCompleted).length,
      recentBadges: [...enrichedBadges]
        .filter((b) => !!b.earnedAt)
        .sort((a, b) => new Date(b.earnedAt ?? 0).getTime() - new Date(a.earnedAt ?? 0).getTime())
        .slice(0, 3),
      upcomingMilestones: enrichedMilestones
        .filter((m) => m.isLocked)
        .sort((a, b) => a.remaining - b.remaining)
        .slice(0, 3),
    };
  }, [badges, milestones, missions, enrichedBadges, enrichedMilestones]);

  const displayLevelInfo = useMemo(() => {
    if (!levelInfo) {
      return {
        currentLevel: 1,
        xpInCurrentLevel: 0,
        xpToNextLevel: 0,
        totalXp,
        title: 'Level 1',
      };
    }

    const xpInCurrentLevel = Math.max(0, levelInfo.xpInCurrentLevel);
    const xpToNextLevel = Math.max(0, levelInfo.xpToNextLevel);

    return {
      currentLevel: levelInfo.currentLevel,
      xpInCurrentLevel,
      xpToNextLevel,
      totalXp,
      title: levelInfo.currentLevelConfig?.title || `Level ${levelInfo.currentLevel}`,
    };
  }, [levelInfo, totalXp]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        refetchCurrentUser(),
        refetchBadges(),
        refetchMilestones(),
        refetchMissions(),
        refetchLevelInfo(),
        refetchGamificationUiConfig(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    refetchBadges,
    refetchCurrentUser,
    refetchGamificationUiConfig,
    refetchLevelInfo,
    refetchMilestones,
    refetchMissions,
  ]);

  if (isLoading) return <LoadingView />;

  return (
    <>
      <CommonHeader
        title="Achievements"
        description="Track your badges, milestones, and missions"
        hideBackButton
        showNotification
        actions={[{ icon: History, onPress: () => router.push('/rewards-history') }]}
        additionalContent={<LevelProgressHeader level={displayLevelInfo} />}
      />

      <ScrollView
        className="flex-1 bg-gray-50 p-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}>
        <AchievementTabSwitcher activeTab={activeTab} onTabChange={handleTabChange} />

        {activeTab === 'overview' && (
          <OverviewTab
            totalBadgeEarned={summaryStats.totalBadgeEarned}
            totalMilestonesAchieved={summaryStats.totalMilestonesAchieved}
            completedMissions={summaryStats.completedMissionsCount}
            totalActiveMissions={summaryStats.activeMissions.length}
            recentBadges={summaryStats.recentBadges}
            upcomingMilestones={summaryStats.upcomingMilestones}
          />
        )}

        {activeTab === 'badges' && (
          <BadgesTab
            badges={enrichedBadges}
            config={gamificationUiConfig}
            onSelectBadge={setSelectedBadgeId}
          />
        )}

        {activeTab === 'milestones' && (
          <MilestonesTab milestoneGroups={milestoneGroups} config={gamificationUiConfig} />
        )}

        {activeTab === 'missions' && (
          <MissionsTab
            missions={summaryStats.activeMissions}
            isError={missionsLoadError}
            onRetry={() => {
              void refetchMissions();
            }}
            sectionTitle={gamificationUiConfig.missionSectionTitle}
            sectionDescription={gamificationUiConfig.missionSectionDescription}
          />
        )}
      </ScrollView>

      <BadgeDetailsModal
        badge={selectedBadge}
        visible={!!selectedBadge}
        onClose={() => setSelectedBadgeId(null)}
      />
    </>
  );
};

export default AchievementsScreen;
