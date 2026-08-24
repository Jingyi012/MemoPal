import { Colors } from '@/constants/colors';
import { LevelXpProgressBar, getLevelProgressMetrics } from '@/components/LevelXpProgressBar';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';

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
    <LinearGradient
      colors={[theme.night, theme.nightDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ marginTop: 10, borderRadius: 22, padding: 16, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', width: 140, height: 140, borderRadius: 70, right: -30, top: -45, backgroundColor: 'rgba(255, 201, 60, 0.2)' }} />
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
          <Text className="text-sm font-normal text-[#E3DFFF]">{level.title}</Text>
        </View>

        <View className="ml-auto items-end">
          <Text className="text-sm font-semibold text-white">
            {isMaxLevel ? 'MAX LEVEL' : `${level.xpInCurrentLevel}/${levelWindowXp} XP`}
          </Text>
          <Text className="text-sm text-[#E3DFFF]">
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
    </LinearGradient>
  );
};
