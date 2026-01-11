import { Award, Flame, Target } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { CommonHeader } from '@/components/CommonHeader';
import { Colors } from '@/constants/colors';
import { LevelsAndBadgesResponse } from '@/types/levelAndbadge';
import data from '@/utils/mock/badges.json';
import { BadgeCard } from './BadgeCard';
import { LevelProgressHeader } from './LevelProgressHeader';
import { MilestoneItem } from './MilestoneItem';
import { StatCard } from './StatCard';

const BadgesScreen: React.FC = () => {
  const { level, stat, badges, milestones } = data as LevelsAndBadgesResponse;

  return (
    <>
      <CommonHeader
        title="Level & Achievement"
        description="View your achievement"
        hideBackButton
        showNotification
        additionalContent={<LevelProgressHeader level={level} />}
      />

      <ScrollView
        className="flex-1 bg-gray-50 p-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Stats Section */}
        <View className="mb-6 flex-row gap-3">
          <StatCard
            label="Badges"
            value={stat.totalBadgeEarned}
            icon={Award}
            color={Colors.yellow400}
          />
          <StatCard label="Streak" value={stat.streak} icon={Flame} color={Colors.orange400} />
          <StatCard
            label="Words"
            value={stat.totalWordsLearned}
            icon={Target}
            color={Colors.teal400}
          />
        </View>

        {/* Badges Section */}
        <Text className="mb-3 font-medium">Badges</Text>
        <View className="-mx-1.5 mb-6 flex-row flex-wrap">
          {badges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </View>

        {/* Milestones Section */}
        <Text className="mb-3 font-medium">Level Milestones</Text>
        {milestones.map((m) => (
          <MilestoneItem key={m.level} milestone={m} />
        ))}
      </ScrollView>
    </>
  );
};

export default BadgesScreen;
