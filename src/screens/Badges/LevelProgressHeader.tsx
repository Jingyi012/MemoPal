import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  level: {
    currentLevel: number;
    xp: number;
    xpToNextLevel: number;
    title: string;
  };
}

export const LevelProgressHeader: React.FC<Props> = ({ level }) => {
  const progress = (level.xp / level.xpToNextLevel) * 100;

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
          <Text className="font-medium text-white">Level {level.currentLevel}</Text>
          <Text className="text-sm font-normal text-teal-100">{level.title}</Text>
        </View>

        <View className="ml-auto items-end">
          <Text className="text-white">{level.xp} xp</Text>
          <Text className="text-xs text-teal-100">{level.xpToNextLevel} xp to next</Text>
        </View>
      </View>

      <View className="mt-3">
        <View className="h-2 overflow-hidden rounded-full bg-white/20">
          <LinearGradient
            colors={[Colors.yellow300, Colors.orange500]}
            start={[0, 0]}
            end={[1, 0]}
            className="h-full rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>
    </View>
  );
};
