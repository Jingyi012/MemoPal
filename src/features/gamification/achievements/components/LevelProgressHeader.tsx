import { Colors } from '@/constants/colors';
import { LevelXpProgressBar, getLevelProgressMetrics } from '@/components/LevelXpProgressBar';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  level: {
    currentLevel: number;
    xpInCurrentLevel: number;
    xpToNextLevel: number;
    totalXp: number;
    title: string;
  };
}

export const LevelProgressHeader: React.FC<Props> = ({ level }) => {
  const { levelWindowXp, isMaxLevel } = getLevelProgressMetrics(
    level.xpInCurrentLevel,
    level.xpToNextLevel
  );

  return (
    <View className="mt-3 rounded-xl bg-gray-100/20 p-3">
      <View className="flex-row items-center">
        <LinearGradient
          colors={[Colors.yellow300, Colors.orange600]}
          start={[0, 0]}
          end={[1, 1]}
          style={{ borderRadius: 10 }}
          className="h-14 w-14 items-center justify-center rounded-xl">
          <Trophy size={26} color="white" />
        </LinearGradient>

        <View className="ml-3">
          <Text className="text-base font-semibold text-white">Level {level.currentLevel}</Text>
          <Text className="text-sm font-normal text-teal-100">{level.title}</Text>
        </View>

        <View className="ml-auto items-end">
          <Text className="text-sm font-semibold text-white">
            {isMaxLevel ? 'MAX LEVEL' : `${level.xpInCurrentLevel}/${levelWindowXp} XP`}
          </Text>
          <Text className="text-sm text-teal-100">
            {isMaxLevel
              ? `Total ${level.totalXp} XP`
              : `${level.xpToNextLevel} XP to next level`}
          </Text>
        </View>
      </View>

      <View className="mt-3">
        <LevelXpProgressBar
          xpInCurrentLevel={level.xpInCurrentLevel}
          xpToNextLevel={level.xpToNextLevel}
          showPercent
        />
      </View>
    </View>
  );
};
