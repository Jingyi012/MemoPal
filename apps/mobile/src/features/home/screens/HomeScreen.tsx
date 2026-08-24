import AnimatedPressable from '@/components/AnimatedPressable';
import { BaseCard, getBaseCardClassName } from '@/components/BaseCard';
import TutorialPromptCard from '@/components/PromptCard/TutorialPromptCard';
import { useUserState } from '@/contexts/UserStateContext';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useMemoryModuleAccess } from '@/core/memory';
import { useGamificationUiConfig } from '@/features/gamification/shared/hooks/useGamificationUiConfig';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { useMissions } from '@/features/gamification/shared/hooks/useMissions';
import { HomeHeader } from '@/features/home/components/Header/HomeHeader';
import { useMemorySets } from '@/features/memory-sets';
import { useDueMemoryReviews } from '@/features/practice-attempts';
import { useRouter } from 'expo-router';
import { ArrowRight, Hash, MapPinned } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { DailyTip } from '../components/DailyTip';
import { TodayReviewCard } from '../components/TodayReviewCard';

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
      className: 'mb-2 border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4',
      padding: 'none',
    })}>
    <Text className="font-bold text-[#2B2A3D]">{title}</Text>
    <Text className="mt-0.5 text-xs text-[#6B6A80]">{subtitle}</Text>
  </AnimatedPressable>
);

const ContinueSessionCard = ({
  memorySet,
  onPress,
}: {
  memorySet: { title: string; techniqueKey: 'palace' | 'number-peg'; items: { id: string }[]; updatedAt: string };
  onPress: () => void;
}) => {
  const isPalace = memorySet.techniqueKey === 'palace';
  return (
    <View className="mt-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-bold text-[#2B2A3D]">Continue where you left off</Text>
        <Text className="text-xs font-bold uppercase tracking-[0.7px] text-[#A19DAE]">Recent</Text>
      </View>
      <AnimatedPressable
        onPress={onPress}
        className="rounded-[22px] border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4">
        <View className="flex-row items-center">
          <View className={`h-12 w-12 items-center justify-center rounded-2xl ${isPalace ? 'bg-[#EEE9FF]' : 'bg-[#FFF0F4]'}`}>
            {isPalace ? <MapPinned size={23} color="#6654D9" /> : <Hash size={23} color="#C83A63" />}
          </View>
          <View className="ml-3 min-w-0 flex-1">
            <Text className={`text-[10px] font-black uppercase tracking-[0.8px] ${isPalace ? 'text-[#6654D9]' : 'text-[#C83A63]'}`}>
              {isPalace ? 'Memory Palace' : 'Number Peg'}
            </Text>
            <Text numberOfLines={1} className="mt-1 text-[17px] font-black text-[#2B2A3D]">
              {memorySet.title}
            </Text>
            <Text className="mt-1 text-xs font-semibold text-[#6B6A80]">
              {memorySet.items.length} items · Updated {formatMemorySetDate(memorySet.updatedAt)}
            </Text>
          </View>
          <ArrowRight size={20} color="#A19DAE" />
        </View>
        <View className="mt-3 flex-row items-center justify-center rounded-xl bg-[#FFC93C] px-3 py-2.5">
          <Text className="text-xs font-black text-[#2B2A3D]">Open session details</Text>
          <ArrowRight size={15} color="#2B2A3D" style={{ marginLeft: 6 }} />
        </View>
      </AnimatedPressable>
    </View>
  );
};

const HomeScreen = () => {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, refetch: refetchCurrentUser } = useCurrentUser();
  const { enabled: palaceEnabled } = useMemoryModuleAccess('palace');
  const { enabled: numberPegEnabled } = useMemoryModuleAccess('number-peg');
  const totalXp = Math.max(0, user?.totalXp ?? 0);
  const { levelInfo, refetch: refetchLevelInfo } = useLevelByXp(totalXp, user?.level);
  const { missions, refetch: refetchMissions } = useMissions();
  const { config: gamificationUiConfig, refetch: refetchGamificationUiConfig } =
    useGamificationUiConfig();
  const { data: dueMemoryReviews = [], refetch: refetchMemoryReviews } = useDueMemoryReviews();
  const { data: memorySets = [], refetch: refetchMemorySets } = useMemorySets();
  const { userState, updateState } = useUserState();
  const recentMemorySet = memorySets
    .filter((memorySet) => memorySet.status !== 'archived')
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];

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
        refetchLevelInfo(),
        refetchMissions(),
        refetchGamificationUiConfig(),
        refetchMemoryReviews(),
        refetchMemorySets(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    refetchCurrentUser,
    refetchGamificationUiConfig,
    refetchLevelInfo,
    refetchMissions,
    refetchMemoryReviews,
    refetchMemorySets,
  ]);

  return (
    <View className="flex-1 bg-white">
      <HomeHeader userData={headerUser} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 py-2">
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

          {dueMemoryReviews.length > 0 ? (
            <TodayReviewCard
              reviews={dueMemoryReviews}
              onOpen={(review) => router.push(`/memory-details/${review.memorySetId}`)}
            />
          ) : null}

          {recentMemorySet ? (
            <ContinueSessionCard
              memorySet={recentMemorySet}
              onPress={() => router.push(`/memory-details/${recentMemorySet.id}`)}
            />
          ) : null}

          <BaseCard className="mt-4 border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4" padding="none">
            <Text className="text-base font-bold text-[#2B2A3D]">
              {gamificationUiConfig.homeMissionCardTitle}
            </Text>
            <Text className="mt-1 text-sm text-[#6B6A80]">
              {gamificationUiConfig.homeMissionCardDescription}
            </Text>
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1 rounded-xl bg-[#F6F3EA] px-3 py-2">
                <Text className="text-xs text-[#6B6A80]">Active Missions</Text>
                <Text className="mt-1 text-lg font-bold text-[#2B2A3D]">
                  {activeMissions.length}
                </Text>
              </View>
              <View className="flex-1 rounded-xl bg-[#F1FBF5] px-3 py-2">
                <Text className="text-xs text-[#3FB87F]">Completed</Text>
                <Text className="mt-1 text-lg font-bold text-[#3FB87F]">
                  {completedMissionCount}
                </Text>
              </View>
            </View>
            {missionPreview.length > 0 ? (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {missionPreview.map((mission) => (
                  <View key={mission.key} className="rounded-full bg-[#F6F3EA] px-3 py-1">
                    <Text className="text-xs font-medium text-[#2B2A3D]">{mission.title}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="mt-3 text-xs text-[#6B6A80]">No active missions right now.</Text>
            )}
            <AnimatedPressable
              onPress={() =>
                router.push({ pathname: '/(tabs)/achievements', params: { tab: 'missions' } })
              }
              className="mt-3 items-center rounded-xl bg-[#2B2A3D] px-3 py-2">
              <Text className="text-xs font-semibold text-white">Open Missions</Text>
            </AnimatedPressable>
          </BaseCard>

          <View className="mt-4">
            <Text className="mb-2 text-base font-bold text-[#2B2A3D]">Quick Actions</Text>
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
                  onPress={() => {
                    const targetMemorySetId = dueMemoryReviews[0]?.memorySetId ?? recentMemorySet?.id;
                    router.push(targetMemorySetId ? `/memory-details/${targetMemorySetId}` : '/practice');
                  }}
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

            {palaceEnabled ? (
              <QuickAction
                title="Build a Memory Palace"
                subtitle="Place your ideas along one visual journey"
                onPress={() => router.push('/palaces/create-memory')}
              />
            ) : null}
            {numberPegEnabled ? (
              <QuickAction
                title="Start a Number Peg"
                subtitle="Turn a short list into tiny, memorable movies"
                onPress={() => router.push('/number-peg/create')}
              />
            ) : null}
          </View>

          <DailyTip />

        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

function formatMemorySetDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recently';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
