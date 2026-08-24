import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View } from 'react-native';

export interface LevelProgressMetrics {
  isMaxLevel: boolean;
  levelWindowXp: number;
  progress: number;
}

export function getLevelProgressMetrics(
  xpInCurrentLevel: number,
  xpToNextLevel: number
): LevelProgressMetrics {
  const clampedXpInCurrentLevel = Math.max(0, xpInCurrentLevel);
  const clampedXpToNextLevel = Math.max(0, xpToNextLevel);
  const levelWindowXp = Math.max(0, clampedXpInCurrentLevel + clampedXpToNextLevel);
  const isMaxLevel = clampedXpToNextLevel <= 0;
  const progress =
    isMaxLevel || levelWindowXp <= 0
      ? 100
      : Math.max(0, Math.min(100, Math.round((clampedXpInCurrentLevel / levelWindowXp) * 100)));

  return {
    isMaxLevel,
    levelWindowXp,
    progress,
  };
}

interface LevelXpProgressBarProps {
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  showPercent?: boolean;
  trackClassName?: string;
  fillClassName?: string;
  percentClassName?: string;
}

export const LevelXpProgressBar: React.FC<LevelXpProgressBarProps> = ({
  xpInCurrentLevel,
  xpToNextLevel,
  showPercent = false,
  trackClassName = 'h-2 overflow-hidden rounded-full bg-white/20',
  fillClassName = 'h-full rounded-full',
  percentClassName = 'mt-1 text-right text-[11px] text-[#E3DFFF]',
}) => {
  const { progress } = getLevelProgressMetrics(xpInCurrentLevel, xpToNextLevel);

  return (
    <>
      <View className={trackClassName}>
        <LinearGradient
          colors={[theme.sun, theme.sunDeep]}
          start={[0, 0]}
          end={[1, 0]}
          className={fillClassName}
          style={{ width: `${progress}%` }}
        />
      </View>

      {showPercent ? <Text className={percentClassName}>{progress}%</Text> : null}
    </>
  );
};
