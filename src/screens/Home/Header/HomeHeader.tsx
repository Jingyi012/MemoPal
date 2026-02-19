import { AppImage } from '@/components/AppImage';
import { User } from '@/types/users';
import { greetingByTime } from '@/utils/greeting';
import { User2 } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { CommonHeader } from '../../../components/CommonHeader';
import { NotificationBell } from '../../../components/NotificationBell';
import { LevelProgress } from './LevelProgress';
import { StreakBadge } from './StreakBadge';

interface HomeHeaderProps {
  userData: User;
}

export function HomeHeader({ userData }: HomeHeaderProps) {
  const name = userData?.displayName ?? 'Welcome';
  const level = userData?.level;
  const isPremium = userData?.isPremium ?? false;
  const avatar = userData?.avatarUrl;

  const xpToNextLevel = (userData.level + 1) * 100;
  const xpProgress = ((userData.totalXp % 100) / xpToNextLevel) * 100;

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
          <Text className="text-xs text-teal-100">New here? Let's get started 🚀</Text>
        )
      }
      // Actions (right side icons)
      actions={[
        {
          component: <NotificationBell unreadCount={3} />,
        },
      ]}
      // Back button slot replaced with avatar
      leftComponent={
        avatar ? (
          <AppImage
            source={{ uri: avatar }}
            className="h-10 w-10 rounded-full border-2 border-white"
          />
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-white/20">
            <User2 size={20} color="white" />
          </View>
        )
      }
      // Additional content below header
      additionalContent={
        <>
          <LevelProgress
            userData={userData}
            xpToNextLevel={xpToNextLevel}
            xpProgress={xpProgress}
          />
          <StreakBadge streak={userData.stats?.currentStreak ?? 1} />
        </>
      }
    />
  );
}
