import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useAllBadges } from '@/hooks/useBadges';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useGamificationUiConfig } from '@/hooks/useGamificationUiConfig';
import { useLevelByXp } from '@/hooks/useLevelConfigs';
import { useMilestones } from '@/hooks/useMilestones';
import { useMissions } from '@/hooks/useMissions';
import { useTotalXp } from '@/hooks/useXpEvents';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { History } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { BadgeDetailsModal } from './BadgeDetailsModal';
import { AchievementTab, AchievementTabSwitcher } from './AchievementTabSwitcher';
import { BadgesTab } from './BadgesTab';
import { LevelProgressHeader } from './LevelProgressHeader';
import { MilestonesTab } from './MilestonesTab';
import { MissionsTab } from './MissionsTab';
import { OverviewTab } from './OverviewTab';

function isAchievementTab(value: string | string[] | undefined): value is AchievementTab {
  if (Array.isArray(value)) {
    return false;
  }

  return value === 'overview' || value === 'badges' || value === 'milestones' || value === 'missions';
}

const AchievementsScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user, isLoading: userLoading } = useCurrentUser();
  const { badges, isLoading: badgesLoading } = useAllBadges();
  const { milestones, isLoading: milestonesLoading } = useMilestones();
  const { missions, isLoading: missionsLoading, isError: missionsLoadError, refetch } = useMissions();
  const { totalXp, isLoading: xpLoading } = useTotalXp();
  const { levelInfo, isLoading: levelInfoLoading } = useLevelByXp(totalXp);
  const { config: gamificationUiConfig } = useGamificationUiConfig();
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AchievementTab>('overview');

  useEffect(() => {
    if (!isAchievementTab(params.tab)) {
      return;
    }

    setActiveTab(params.tab);
  }, [params.tab]);

  const isLoading =
    badgesLoading ||
    milestonesLoading ||
    missionsLoading ||
    userLoading ||
    xpLoading ||
    levelInfoLoading;

  const enrichedBadges = useMemo(
    () =>
      badges.map((badge) => ({
        ...badge,
        isEarned: !!badge.earnedAt,
      })),
    [badges]
  );

  const selectedBadge = useMemo(
    () => enrichedBadges.find((badge) => badge.id === selectedBadgeId) ?? null,
    [enrichedBadges, selectedBadgeId]
  );

  const currentMetricValue = useCallback(
    (conditionType: string) => {
      switch ((conditionType || '').toLowerCase()) {
        case 'level':
          return user?.level ?? levelInfo?.currentLevel ?? 1;
        case 'total_xp':
        case 'xp_earned':
          return totalXp;
        case 'lessons_completed':
          return user?.stats?.lessonsCompleted ?? 0;
        case 'words_learned':
          return user?.stats?.wordsLearned ?? 0;
        case 'streak_days':
          return user?.stats?.currentStreak ?? 0;
        case 'mastered_lessons':
          return milestones.filter((milestone) => !!milestone.achievedAt).length;
        default:
          return 0;
      }
    },
    [
      levelInfo?.currentLevel,
      milestones,
      totalXp,
      user?.level,
      user?.stats?.currentStreak,
      user?.stats?.lessonsCompleted,
      user?.stats?.wordsLearned,
    ]
  );

  const enrichedMilestones = useMemo(() => {
    return milestones
      .map((milestone) => {
        const targetValue = Math.max(1, milestone.conditionValue ?? 1);
        const currentValue = currentMetricValue(milestone.conditionType);
        const progressPercent = Math.min(100, Math.round((currentValue / targetValue) * 100));
        const isLocked = !milestone.achievedAt;

        return {
          ...milestone,
          isLocked,
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
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(milestone);
    }

    return Object.entries(groups)
      .map(
        ([conditionType, items]) =>
          [conditionType, [...items].sort((a, b) => a.targetValue - b.targetValue)] as const
      )
      .sort(([a], [b]) => a.localeCompare(b));
  }, [enrichedMilestones]);

  const totalBadgeEarned = useMemo(() => badges.filter((badge) => !!badge.earnedAt).length, [badges]);
  const totalMilestonesAchieved = useMemo(
    () => milestones.filter((milestone) => !!milestone.achievedAt).length,
    [milestones]
  );
  const activeMissions = useMemo(
    () => missions.filter((mission) => mission.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [missions]
  );
  const completedMissions = useMemo(
    () => activeMissions.filter((mission) => mission.isCompleted).length,
    [activeMissions]
  );
  const recentBadges = useMemo(
    () =>
      [...enrichedBadges]
        .filter((badge) => !!badge.earnedAt)
        .sort((a, b) => new Date(b.earnedAt ?? 0).getTime() - new Date(a.earnedAt ?? 0).getTime())
        .slice(0, 3),
    [enrichedBadges]
  );
  const upcomingMilestones = useMemo(
    () =>
      enrichedMilestones
        .filter((milestone) => milestone.isLocked)
        .sort((a, b) => a.remaining - b.remaining)
        .slice(0, 3),
    [enrichedMilestones]
  );

  const displayLevelInfo = useMemo(() => {
    if (!levelInfo) {
      return {
        currentLevel: 1,
        xp: 0,
        xpToNextLevel: 0,
        title: 'Level 1',
      };
    }

    return {
      currentLevel: levelInfo.currentLevel,
      xp: levelInfo.xpInCurrentLevel,
      xpToNextLevel: levelInfo.xpToNextLevel,
      title: levelInfo.currentLevelConfig?.title || `Level ${levelInfo.currentLevel}`,
    };
  }, [levelInfo]);

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <>
      <CommonHeader
        title="Achievements"
        description="Track your badges, milestones, and missions"
        hideBackButton
        showNotification
        actions={[
          {
            icon: History,
            onPress: () => router.push('/rewards-history'),
          },
        ]}
        additionalContent={<LevelProgressHeader level={displayLevelInfo} />}
      />

      <ScrollView
        className="flex-1 bg-gray-50 p-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}>
        <AchievementTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'overview' ? (
          <OverviewTab
            totalBadgeEarned={totalBadgeEarned}
            totalMilestonesAchieved={totalMilestonesAchieved}
            completedMissions={completedMissions}
            totalActiveMissions={activeMissions.length}
            recentBadges={recentBadges}
            upcomingMilestones={upcomingMilestones}
          />
        ) : null}

        {activeTab === 'badges' ? (
          <BadgesTab
            badges={enrichedBadges}
            config={gamificationUiConfig}
            onSelectBadge={setSelectedBadgeId}
          />
        ) : null}

        {activeTab === 'milestones' ? (
          <MilestonesTab milestoneGroups={milestoneGroups} config={gamificationUiConfig} />
        ) : null}

        {activeTab === 'missions' ? (
          <MissionsTab
            missions={activeMissions}
            isError={missionsLoadError}
            onRetry={() => {
              void refetch();
            }}
            sectionTitle={gamificationUiConfig.missionSectionTitle}
            sectionDescription={gamificationUiConfig.missionSectionDescription}
          />
        ) : null}
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

