import { PremiumUpdateCard } from '@/components/PremiumUpdateCard';
import TutorialPromptCard from '@/components/PromptCard/TutorialPromptCard';
import { useUserState } from '@/contexts/UserStateContext';
import { useAllBadges } from '@/hooks/useBadges';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLevelByXp } from '@/hooks/useLevelConfigs';
import { useMilestones } from '@/hooks/useMilestones';
import { useTotalXp } from '@/hooks/useXpEvents';
import { HomeHeader } from '@/screens/Home/Header/HomeHeader';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { PalaceTrainingCard } from './PalaceTrainingCard';

const ActionButton = ({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) => (
  <Text onPress={onPress} className="mb-2 rounded-2xl bg-white p-4 text-slate-800">
    <Text className="font-bold">{title}\n</Text>
    <Text className="text-xs text-slate-500">{subtitle}</Text>
  </Text>
);

const HomeScreen = () => {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { totalXp } = useTotalXp();
  const { levelInfo } = useLevelByXp(totalXp);
  const { milestones } = useMilestones();
  const { badges } = useAllBadges();
  const { userState, updateState } = useUserState();

  const isFirstTime = userState.isFirstTime ?? true;
  const showTutorialPrompt = !userState.ui.tutorialPromptDismissed;

  const headerUser = user
    ? {
        ...user,
        totalXp,
        level: levelInfo?.currentLevel ?? user.level,
      }
    : {
        id: 'guest',
        displayName: 'Guest',
        email: 'guest@local',
        totalXp: 0,
        level: 1,
        isPremium: false,
      };

  const achievedMilestones = milestones.filter((m) => !!m.achievedAt).length;
  const earnedBadges = badges.filter((b) => !!b.earnedAt).length;

  return (
    <View className="flex-1 bg-slate-50">
      <HomeHeader userData={headerUser} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-4">
          {isFirstTime && <PalaceTrainingCard />}

          {showTutorialPrompt && (
            <View className="mt-3">
              <TutorialPromptCard
                dismissTutorialPrompt={() =>
                  updateState({
                    ui: { ...userState.ui, tutorialPromptDismissed: true },
                  })
                }
                onViewTutorial={() =>
                  updateState({
                    ui: {
                      ...userState.ui,
                      tutorialPromptDismissed: true,
                      tutorialViewedAt: new Date().toISOString(),
                    },
                  })
                }
              />
            </View>
          )}

          <View className="mt-4 rounded-2xl bg-teal-600 p-4">
            <Text className="text-lg font-bold text-white">Daily Focus</Text>
            <Text className="mt-1 text-sm text-teal-100">Keep the streak alive with one quick review session.</Text>
            <Text
              onPress={() => router.push('/(tabs)/palaces')}
              className="mt-3 self-start rounded-xl bg-white px-4 py-2 font-semibold text-teal-700">
              Start Session
            </Text>
          </View>

          <View className="mt-4 flex-row gap-2">
            <View className="flex-1 rounded-2xl bg-white p-3">
              <Text className="text-xs text-slate-500">Today XP</Text>
              <Text className="mt-1 text-lg font-bold text-slate-900">{totalXp}</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-white p-3">
              <Text className="text-xs text-slate-500">Current Streak</Text>
              <Text className="mt-1 text-lg font-bold text-slate-900">{headerUser.stats?.currentStreak ?? 0} 🔥</Text>
            </View>
          </View>

          <View className="mt-4 rounded-2xl bg-white p-4">
            <Text className="text-base font-bold text-slate-900">Achievements Snapshot</Text>
            <Text className="mt-2 text-sm text-slate-600">{earnedBadges} badges earned • {achievedMilestones} milestones unlocked</Text>
            <Text onPress={() => router.push('/badges')} className="mt-3 text-sm font-semibold text-teal-700">View Achievements →</Text>
          </View>

          <View className="mt-4">
            <Text className="mb-2 text-base font-bold text-slate-800">Quick Actions</Text>
            <ActionButton title="Browse Palaces" subtitle="Pick a palace and continue progress" onPress={() => router.push('/(tabs)/palaces')} />
            <ActionButton title="Review Now" subtitle="Practice recall and earn XP" onPress={() => router.push('/(tabs)/palaces')} />
            <ActionButton title="Create Custom Lesson" subtitle="Build your own lesson from locations" onPress={() => router.push('/(tabs)/palaces')} />
          </View>

          {!user?.isPremium ? <PremiumUpdateCard className="mt-6" /> : null}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
