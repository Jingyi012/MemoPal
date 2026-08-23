import AnimatedPressable from '@/components/AnimatedPressable';
import { BaseCard, getBaseCardClassName } from '@/components/BaseCard';
import { PremiumUpdateCard } from '@/components/PremiumUpdateCard';
import TutorialPromptCard from '@/components/PromptCard/TutorialPromptCard';
import { useUserState } from '@/contexts/UserStateContext';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useMemoryModuleAccess } from '@/core/memory';
import { useDueReviews } from '@/features/palace';
import { useFeatureLimits } from '@/features/subscription/hooks/useFeatureLimits';
import { useGamificationUiConfig } from '@/features/gamification/shared/hooks/useGamificationUiConfig';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { useMissions } from '@/features/gamification/shared/hooks/useMissions';
import { HomeHeader } from '@/features/home/components/Header/HomeHeader';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { DailyTip } from '../components/DailyTip';
import { ReviewDueBadge } from '../components/ReviewDueBadge';

const QuickAction = ({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) => (
  <AnimatedPressable
    onPress={onPress}
    className={getBaseCardClassName({
      className: 'mb-2 p-4',
      padding: 'none',
    })}>
    <Text className="font-bold text-slate-800">{title}</Text>
    <Text className="mt-0.5 text-xs text-slate-500">{subtitle}</Text>
  </AnimatedPressable>
);

const HomeScreen = () => {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, refetch: refetchCurrentUser } = useCurrentUser();
  const { enabled: palaceEnabled } = useMemoryModuleAccess('palace');
  const { limits: featureLimits, refetch: refetchFeatureLimits } = useFeatureLimits();
  const totalXp = Math.max(0, user?.totalXp ?? 0);
  const { levelInfo, refetch: refetchLevelInfo } = useLevelByXp(totalXp, user?.level);
  const { missions, refetch: refetchMissions } = useMissions();
  const { config: gamificationUiConfig, refetch: refetchGamificationUiConfig } =
    useGamificationUiConfig();
  const { dueReviews, dueLessons, refetch: refetchDueReviews } = useDueReviews({
    enabled: palaceEnabled,
  });
  const { userState, updateState } = useUserState();

  const showTutorialPrompt = !userState.ui.tutorialPromptDismissed;
  const canCreateCustomPalace = palaceEnabled && featureLimits.customPalaces > 0;

  const dueCount = dueReviews.length;

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

  const activeMissions = missions
    .filter((mission) => mission.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const previewMissionCount = Math.max(0, gamificationUiConfig.homeMissionPreviewCount);
  const missionPreview = activeMissions.slice(0, previewMissionCount);
  const completedMissionCount = activeMissions.filter((mission) => mission.isCompleted).length;

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        refetchCurrentUser(),
        refetchFeatureLimits(),
        refetchLevelInfo(),
        refetchMissions(),
        refetchGamificationUiConfig(),
        palaceEnabled ? refetchDueReviews() : Promise.resolve(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    refetchCurrentUser,
    refetchDueReviews,
    refetchFeatureLimits,
    refetchGamificationUiConfig,
    refetchLevelInfo,
    refetchMissions,
    palaceEnabled,
  ]);

  return (
    <View className="flex-1 bg-slate-50">
      <HomeHeader userData={headerUser} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 py-2">
          {/* {isFirstTime && <PalaceTrainingCard />} */}

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

          {palaceEnabled ? (
            <ReviewDueBadge
              dueCount={dueCount}
              dueLessons={dueLessons}
              onOpenLesson={(lessonId) => router.push(`/lessons/${lessonId}`)}
              onOpenAll={() => router.push('/palaces')}
            />
          ) : null}

          {palaceEnabled ? (
            <BaseCard className="mt-3 bg-teal-600 p-4" padding="none" shadow="sm" bordered={false}>
            <Text className="text-lg font-bold text-white">Daily Focus</Text>
            <Text className="mt-1 text-sm text-teal-100">
              {dueCount > 0
                ? `${dueCount} review${dueCount > 1 ? 's' : ''} waiting for you`
                : 'No due review right now. Continue learning to build momentum.'}
            </Text>
            <AnimatedPressable
              onPress={() => router.push('/palaces')}
              className="mt-3 self-start rounded-xl bg-white px-4 py-2">
              <Text className="font-semibold text-teal-700">
                {dueCount > 0 ? 'Review Now' : 'Browse Palaces'}
              </Text>
            </AnimatedPressable>
            </BaseCard>
          ) : null}

          <BaseCard className="mt-4 p-4" padding="none">
            <Text className="text-base font-bold text-slate-900">
              {gamificationUiConfig.homeMissionCardTitle}
            </Text>
            <Text className="mt-1 text-sm text-slate-500">
              {gamificationUiConfig.homeMissionCardDescription}
            </Text>
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1 rounded-xl bg-slate-100 px-3 py-2">
                <Text className="text-xs text-slate-500">Active Missions</Text>
                <Text className="mt-1 text-lg font-bold text-slate-900">
                  {activeMissions.length}
                </Text>
              </View>
              <View className="flex-1 rounded-xl bg-emerald-50 px-3 py-2">
                <Text className="text-xs text-emerald-700">Completed</Text>
                <Text className="mt-1 text-lg font-bold text-emerald-700">
                  {completedMissionCount}
                </Text>
              </View>
            </View>
            {missionPreview.length > 0 ? (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {missionPreview.map((mission) => (
                  <View key={mission.key} className="rounded-full bg-slate-100 px-3 py-1">
                    <Text className="text-xs font-medium text-slate-700">{mission.title}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="mt-3 text-xs text-slate-500">No active missions right now.</Text>
            )}
            <AnimatedPressable
              onPress={() =>
                router.push({ pathname: '/(tabs)/achievements', params: { tab: 'missions' } })
              }
              className="mt-3 items-center rounded-xl bg-teal-600 px-3 py-2">
              <Text className="text-xs font-semibold text-white">Open Missions</Text>
            </AnimatedPressable>
          </BaseCard>

          <View className="mt-4">
            <Text className="mb-2 text-base font-bold text-slate-800">Quick Actions</Text>
            {palaceEnabled ? (
              <>
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
              </>
            ) : null}
            <QuickAction
              title="Missions"
              subtitle="See all missions and claim XP rewards"
              onPress={() =>
                router.push({ pathname: '/(tabs)/achievements', params: { tab: 'missions' } })
              }
            />

            {canCreateCustomPalace ? (
              <QuickAction
                title="Create Custom Palace"
                subtitle="Create your own visual memory map"
                onPress={() => router.push('/palaces/create')}
              />
            ) : null}
          </View>

          <DailyTip />

          {palaceEnabled && !user?.isPremium && !canCreateCustomPalace ? (
            <PremiumUpdateCard className="mt-4" />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
