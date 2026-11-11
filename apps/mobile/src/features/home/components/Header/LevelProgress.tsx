import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles } from '@/theme/designSystem';
import { LevelXpProgressBar, getLevelProgressMetrics } from '@/components/LevelXpProgressBar';
import { View } from 'react-native';

interface LevelProgressProps {
  level: {
    currentLevel: number;
    xpInCurrentLevel: number;
    xpToNextLevel: number;
    title: string;
  };
}

export function LevelProgress({ level }: LevelProgressProps) {
  const { levelWindowXp, isMaxLevel } = getLevelProgressMetrics(
    level.xpInCurrentLevel,
    level.xpToNextLevel
  );

  return (
    <View className="space-y-2">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-[#E3DFFF]" style={appTextStyles.caption}>Level {level.currentLevel}</Text>
        <Text className="text-white" style={appTextStyles.caption}>
          {isMaxLevel ? 'MAX LEVEL' : `${level.xpInCurrentLevel}/${levelWindowXp} XP`}
        </Text>
      </View>

      <LevelXpProgressBar
        xpInCurrentLevel={level.xpInCurrentLevel}
        xpToNextLevel={level.xpToNextLevel}
        trackClassName="h-2.5 overflow-hidden rounded-full bg-white/20"
      />
    </View>
  );
}
