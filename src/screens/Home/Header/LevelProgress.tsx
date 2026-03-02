import { User } from '@/types/users';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

interface LevelProgressProps {
  userData: User;
  xpToNextLevel: number;
  xpInCurrentLevel?: number;
  xpProgress: number; // 0-100
}

export function LevelProgress({ userData, xpToNextLevel, xpInCurrentLevel = 0, xpProgress }: LevelProgressProps) {
  return (
    <View className="space-y-2">
      {/* XP Text */}
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs text-teal-100">Progress to Level {userData.level + 1}</Text>
        <Text className="text-xs text-white">
          {xpInCurrentLevel} XP • {xpToNextLevel} XP to next
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
          style={{ width: `${xpProgress}%` }}
        />
      </View>
    </View>
  );
}
