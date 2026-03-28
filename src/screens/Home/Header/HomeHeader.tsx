import { AppImage } from '@/components/AppImage';
import { useLevelByXp } from '@/hooks/useLevelConfigs';
import { User } from '@/types/users';
import { greetingByTime } from '@/utils/greeting';
import { User2 } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { CommonHeader } from '../../../components/CommonHeader';
import { NotificationBell } from '../../../components/NotificationBell';
import { LevelProgress } from './LevelProgress';
import { StreakBadge } from './StreakBadge';
import { useMemo } from 'react';

interface HomeHeaderProps {
  userData: User;
}

export function HomeHeader({ userData }: HomeHeaderProps) {
  const name = userData?.displayName ?? 'Welcome';
  const isPremium = userData?.isPremium ?? false;
  const avatar = userData?.avatarUrl;
  const { levelInfo } = useLevelByXp(userData.totalXp, userData.level);

  const displayLevelInfo = useMemo(() => {
    if (!levelInfo) return { currentLevel: 1, xpInCurrentLevel: 0, xpToNextLevel: 0, title: 'Level 1' };
    return {
      currentLevel: levelInfo.currentLevel,
      xpInCurrentLevel: levelInfo.xpInCurrentLevel,
      xpToNextLevel: levelInfo.xpToNextLevel,
      title: levelInfo.currentLevelConfig?.title || `Level ${levelInfo.currentLevel}`,
    };
  }, [levelInfo]);

  const level = levelInfo?.currentLevel ?? userData?.level ?? 1;

  return (
    <CommonHeader
      // Title
      title={`${greetingByTime()}, ${name}!`}
      // Description
      description={
        level !== undefined ? (
          <Text className="text-xs text-teal-100">
            Level {level}
            {isPremium && ' • 👑 Premium'}
          </Text>
        ) : (
          <Text className="text-xs text-teal-100">New here? Let&apos;s get started 🚀</Text>
        )
      }
      // Actions (right side icons)
      actions={[
        {
          component: <NotificationBell />,
        },
      ]}
      // Back button slot replaced with avatar
      leftComponent={
        avatar ? (
          <View className="h-10 w-10">
            <AppImage
              source={{ uri: avatar }}
              style={{ width: '100%', height: '100%', borderRadius: 999 }}
            />
          </View>
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-white/20">
            <User2 size={20} color="white" />
          </View>
        )
      }
      // Additional content below header
      additionalContent={
        <>
          <LevelProgress level={displayLevelInfo} />
          <StreakBadge streak={userData.stats?.currentStreak ?? 0} />
        </>
      }
    />
  );
}
