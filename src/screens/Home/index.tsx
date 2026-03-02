import AnimatedPressable from '@/components/AnimatedPressable';
import { PremiumUpdateCard } from '@/components/PremiumUpdateCard';
import TutorialPromptCard from '@/components/PromptCard/TutorialPromptCard';
import { useUserState } from '@/contexts/UserStateContext';
import { useAllBadges } from '@/hooks/useBadges';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDueReviews } from '@/hooks/useDueReviews';
import { useLevelByXp } from '@/hooks/useLevelConfigs';
import { useMilestones } from '@/hooks/useMilestones';
import { usePalaceList } from '@/hooks/usePalace';
import { useTotalXp } from '@/hooks/useXpEvents';
import { HomeHeader } from '@/screens/Home/Header/HomeHeader';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { DailyTip } from './DailyTip';
import { PalaceTrainingCard } from './PalaceTrainingCard';
import { ReviewDueBadge } from './ReviewDueBadge';

const QuickAction = ({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) => (
  <AnimatedPressable onPress={onPress} className="mb-2 rounded-2xl bg-white p-4">
    <Text className="font-bold text-slate-800">{title}</Text>
    <Text className="mt-0.5 text-xs text-slate-500">{subtitle}</Text>
  </AnimatedPressable>
);

const HomeScreen = () => {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { totalXp } = useTotalXp();
  const { levelInfo } = useLevelByXp(totalXp);
  const { milestones } = useMilestones();
  const { badges } = useAllBadges();
  const { dueReviews } = useDueReviews();
  const { data: palaces = [] } = usePalaceList();
  const { userState, updateState } = useUserState();

  const isFirstTime = userState.isFirstTime ?? true;
  const showTutorialPrompt = !userState.ui.tutorialPromptDismissed;

  const overdueCount = dueReviews.filter((r) => new Date(r.dueDate).getTime() < Date.now()).length;
  const dueCount = dueReviews.length;

  const achievedMilestones = milestones.filter((m) => !!m.achievedAt).length;
  const earnedBadges = badges.filter((b) => !!b.earnedAt).length;

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

          <ReviewDueBadge
            dueCount={dueCount}
            overdueCount={overdueCount}
            onPress={() => router.push('/palaces')}
          />

          <View className="mb-4 rounded-2xl bg-teal-600 p-4">
            <Text className="text-lg font-bold text-white">Daily Focus</Text>
            <Text className="mt-1 text-sm text-teal-100">
              {dueCount > 0
                ? `${dueCount} review${dueCount > 1 ? 's' : ''} waiting for you`
                : 'No due review right now. Continue learning to build momentum.'}
            </Text>
            <AnimatedPressable onPress={() => router.push('/palaces')} className="mt-3 self-start rounded-xl bg-white px-4 py-2">
              <Text className="font-semibold text-teal-700">{dueCount > 0 ? 'Review Now' : 'Browse Palaces'}</Text>
            </AnimatedPressable>
          </View>

          <View className="mb-4 flex-row gap-2">
            <View className="flex-1 rounded-2xl bg-white p-3">
              <Text className="text-xs text-slate-500">Current XP</Text>
              <Text className="mt-1 text-lg font-bold text-slate-900">{totalXp}</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-white p-3">
              <Text className="text-xs text-slate-500">Palaces Available</Text>
              <Text className="mt-1 text-lg font-bold text-slate-900">{palaces.length}</Text>
            </View>
          </View>

          <View className="mb-4 rounded-2xl bg-white p-4">
            <Text className="text-base font-bold text-slate-900">Achievements Snapshot</Text>
            <Text className="mt-2 text-sm text-slate-600">
              {earnedBadges} badges earned • {achievedMilestones} milestones unlocked
            </Text>
            <Text onPress={() => router.push('/badges')} className="mt-3 text-sm font-semibold text-teal-700">
              View Achievements →
            </Text>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-base font-bold text-slate-800">Quick Actions</Text>
            <QuickAction
              title="Browse Palaces"
              subtitle="Choose a palace and continue your journey"
              onPress={() => router.push('/palaces')}
            />
            <QuickAction
              title="Review Session"
              subtitle="Practice due items and keep streak alive"
              onPress={() => router.push('/palaces')}
            />
            <QuickAction
              title="Create Custom Palace"
              subtitle="Premium: create your own visual memory map"
              onPress={() => router.push('/palaces/create')}
            />
          </View>

          <DailyTip />

          {!user?.isPremium ? <PremiumUpdateCard className="mb-2 mt-4" /> : null}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
