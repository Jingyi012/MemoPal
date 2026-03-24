import { User } from '@/types/users';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

interface LevelProgressProps {
  userData: User;
  level: {
    currentLevel: number;
    xp: number;
    xpToNextLevel: number;
    title: string;
  };
}

export function LevelProgress({ userData, level }: LevelProgressProps) {
  const levelWindowXp = Math.max(0, level.xp + level.xpToNextLevel);
  const progress =
    levelWindowXp <= 0
      ? 100
      : Math.max(0, Math.min(100, Math.round((level.xp / levelWindowXp) * 100)));

  return (
    <View className="space-y-2">
      {/* XP Text */}
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs text-teal-100">Level {userData.level}</Text>
        <Text className="text-xs text-white">
          {level.xp}/{Math.max(level.xp, levelWindowXp)} XP
        </Text>
      </View>

      {/* Progress Bar Background */}
      <View className="h-2.5 overflow-hidden rounded-full bg-white/20">
        {/* Progress Bar Fill */}
        <LinearGradient
          colors={['#facc15', '#f97316']}
          start={[0, 0]}
          end={[1, 0]}
          className="h-full rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>
    </View>
  );
}
