import { AppImage } from '@/components/AppImage';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { User } from '@/features/profile/types/users';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { greetingByTime } from '@/utils/greeting';
import { User2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { CommonHeader } from '@/components/CommonHeader';
import { NotificationBell } from '@/components/NotificationBell';
import { useRouter } from 'expo-router';
import { LevelProgress } from './LevelProgress';
import { StreakBadge } from './StreakBadge';
import { useMemo } from 'react';

interface HomeHeaderProps {
  userData: User;
}

export function HomeHeader({ userData }: HomeHeaderProps) {
  const router = useRouter();
  const name = userData?.displayName ?? 'Welcome';
  const isPremium = userData?.isPremium ?? false;
  const avatar = userData?.avatarUrl;
  const { levelInfo } = useLevelByXp(userData.totalXp, userData.level);

  const displayLevelInfo = useMemo(() => {
    if (!levelInfo) {
      return {
        currentLevel: Math.max(1, userData.level ?? 1),
        xpInCurrentLevel: Math.max(0, userData.totalXp ?? 0),
        xpToNextLevel: 0,
        title: `Level ${Math.max(1, userData.level ?? 1)}`,
      };
    }
    return {
      currentLevel: levelInfo.currentLevel,
      xpInCurrentLevel: levelInfo.xpInCurrentLevel,
      xpToNextLevel: levelInfo.xpToNextLevel,
      title: levelInfo.currentLevelConfig?.title || `Level ${levelInfo.currentLevel}`,
    };
  }, [levelInfo, userData.level, userData.totalXp]);

  const level = levelInfo?.currentLevel ?? userData?.level ?? 1;

  return (
    <CommonHeader
      eyebrow="Today"
      // Title
      title={`${greetingByTime()}, ${name}!`}
      // Description
      description={
        level !== undefined ? (
          <Text style={styles.levelDescription}>
            Level {level}
            {isPremium && ' • 👑 Premium'}
          </Text>
        ) : (
          <Text style={styles.levelDescription}>New here? Let&apos;s get started 🚀</Text>
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
        <AnimatedPressable onPress={() => router.push('/(tabs)/profile')} style={styles.avatarButton}>
          {avatar ? (
            <View className="h-10 w-10">
              <AppImage
                source={{ uri: avatar }}
                style={{ width: '100%', height: '100%', borderRadius: 999 }}
              />
            </View>
          ) : (
            <View style={styles.avatarFallback}>
              <User2 size={20} color={theme.berryDeep} />
            </View>
          )}
        </AnimatedPressable>
      }
      // Additional content below header
      additionalContent={
        <LinearGradient
          colors={[theme.night, theme.nightDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.progressCard}>
          <View style={styles.progressGlow} />
          <LevelProgress level={displayLevelInfo} />
          <StreakBadge streak={userData.stats?.currentStreak ?? 0} />
        </LinearGradient>
      }
    />
  );
}

const styles = {
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  levelDescription: {
    color: theme.inkSoft,
    fontSize: 11.5,
    fontWeight: '700' as const,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: '#FFD9E2',
    backgroundColor: '#FFF0F4',
  },
  progressCard: {
    position: 'relative' as const,
    overflow: 'hidden' as const,
    borderRadius: 22,
    padding: 16,
    shadowColor: theme.ink,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 3,
  },
  progressGlow: {
    position: 'absolute' as const,
    width: 140,
    height: 140,
    borderRadius: 70,
    right: -30,
    top: -45,
    backgroundColor: 'rgba(255, 201, 60, 0.2)',
  },
};
