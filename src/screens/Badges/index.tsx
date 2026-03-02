import { Award, Flame, Target } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { Colors } from '@/constants/colors';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAllBadges } from '@/hooks/useBadges';
import { useLevelByXp } from '@/hooks/useLevelConfigs';
import { useMilestones } from '@/hooks/useMilestones';
import { useTotalXp } from '@/hooks/useXpEvents';
import { BadgeCard } from './BadgeCard';
import { LevelProgressHeader } from './LevelProgressHeader';
import { MilestoneItem } from './MilestoneItem';
import { StatCard } from './StatCard';

const BadgesScreen: React.FC = () => {
  const { user, isLoading: userLoading } = useCurrentUser();

  // Fetch consolidated data
  const { badges, isLoading: badgesLoading } = useAllBadges();
  const { milestones, isLoading: milestonesLoading } = useMilestones();
  const { totalXp, isLoading: xpLoading } = useTotalXp();
  const { levelInfo, isLoading: levelInfoLoading } = useLevelByXp(totalXp);

  const isLoading =
    badgesLoading || milestonesLoading || userLoading || xpLoading || levelInfoLoading;

  // Map badges to include isEarned based on the presence of earnedAt
  const enrichedBadges = useMemo(() => {
    return badges.map((badge) => ({
      ...badge,
      isEarned: !!badge.earnedAt,
    }));
  }, [badges]);

  // Map milestones to include isLocked based on achievedAt
  const enrichedMilestones = useMemo(() => {
    return milestones.map((milestone) => ({
      ...milestone,
      isLocked: !milestone.achievedAt,
    }));
  }, [milestones]);

  const totalBadgeEarned = useMemo(() => {
    return badges.filter((b) => !!b.earnedAt).length;
  }, [badges]);

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

  return (
    <>
      <CommonHeader
        title="Level & Achievement"
        description="View your progress"
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
            value={user?.stats?.currentStreak ?? 0}
            icon={Flame}
            color={Colors.orange400}
          />
          <StatCard
            label="Words"
            value={user?.stats?.wordsLearned ?? 0}
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
        <View className="gap-3">
          {enrichedMilestones.map((m) => (
            <MilestoneItem key={m.id} milestone={m} />
          ))}
        </View>
      </ScrollView>
    </>
  );
};

export default BadgesScreen;
