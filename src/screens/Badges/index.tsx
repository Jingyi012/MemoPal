import { Award, Flame, Target } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthProvider';
import { useAllBadges, useUserBadges } from '@/hooks/useBadges';
import { useLevelByXp } from '@/hooks/useLevelConfigs';
import { useMilestones, useUserMilestones } from '@/hooks/useMilestones';
import { useUserStats } from '@/hooks/useUserStats';
import { useUserTotalXp } from '@/hooks/useXpEvents';
import { BadgeCard } from './BadgeCard';
import { LevelProgressHeader } from './LevelProgressHeader';
import { MilestoneItem } from './MilestoneItem';
import { StatCard } from './StatCard';

const BadgesScreen: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';

  // Fetch all data
  const { badges, isLoading: badgesLoading } = useAllBadges();
  const { userBadges, isLoading: userBadgesLoading } = useUserBadges(userId);
  const { milestones, isLoading: milestonesLoading } = useMilestones();
  const { userMilestones, isLoading: userMilestonesLoading } = useUserMilestones(userId);
  const { stats, isLoading: statsLoading } = useUserStats(userId);
  const { totalXp, isLoading: xpLoading } = useUserTotalXp(userId);
  const { levelInfo, isLoading: levelInfoLoading } = useLevelByXp(totalXp);

  const isLoading =
    badgesLoading ||
    userBadgesLoading ||
    milestonesLoading ||
    userMilestonesLoading ||
    statsLoading ||
    xpLoading ||
    levelInfoLoading;

  // Create a map of earned badge IDs for quick lookup
  const earnedBadgeIds = useMemo(() => {
    return new Set(userBadges.map((ub) => ub.badgeId));
  }, [userBadges]);

  // Create a map of achieved milestone IDs for quick lookup
  const achievedMilestoneIds = useMemo(() => {
    return new Set(userMilestones.map((um) => um.milestoneId));
  }, [userMilestones]);

  // Enrich badges with earned status
  const enrichedBadges = useMemo(() => {
    return badges.map((badge) => ({
      ...badge,
      isEarned: earnedBadgeIds.has(badge.id),
    }));
  }, [badges, earnedBadgeIds]);

  // Enrich milestones with achieved status
  const enrichedMilestones = useMemo(() => {
    return milestones.map((milestone) => ({
      ...milestone,
      isLocked: !achievedMilestoneIds.has(milestone.id),
    }));
  }, [milestones, achievedMilestoneIds]);

  // Transform level info for display
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

  const totalBadgeEarned = earnedBadgeIds.size;

  return (
    <>
      <CommonHeader
        title="Level & Achievement"
        description="View your achievement"
        hideBackButton
        showNotification
        additionalContent={<LevelProgressHeader level={displayLevelInfo} />}
      />

      <ScrollView
        className="flex-1 bg-gray-50 p-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Stats Section */}
        <View className="mb-6 flex-row gap-3">
          <StatCard label="Badges" value={totalBadgeEarned} icon={Award} color={Colors.yellow400} />
          <StatCard
            label="Streak"
            value={stats?.currentStreak ?? 0}
            icon={Flame}
            color={Colors.orange400}
          />
          <StatCard
            label="Words"
            value={stats?.wordsLearned ?? 0}
            icon={Target}
            color={Colors.teal400}
          />
        </View>

        {/* Badges Section */}
        <Text className="mb-3 font-medium">Badges</Text>
        <View className="-mx-1.5 mb-6 flex-row flex-wrap">
          {enrichedBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </View>

        {/* Milestones Section */}
        <Text className="mb-3 font-medium">Level Milestones</Text>
        {enrichedMilestones.map((m) => (
          <MilestoneItem key={m.id} milestone={m} />
        ))}
      </ScrollView>
    </>
  );
};

export default BadgesScreen;
