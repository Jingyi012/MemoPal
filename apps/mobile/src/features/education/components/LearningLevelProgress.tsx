import { Text, View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { getLevelProgressMetrics } from '@/components/LevelXpProgressBar';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { learningTypography as typography } from '../theme/learningTheme';
import { LearningProgress, useLearningCopy, useLearningStyles } from './LearningUi';

export function LearningLevelProgress({ totalXp, level }: { totalXp: number; level: number }) {
  const { styles: s, theme } = useLearningStyles();
  const { zh } = useLearningCopy();
  const query = useLevelByXp(totalXp, level);
  const progress = query.levelInfo;
  const metrics = progress ? getLevelProgressMetrics(progress.xpInCurrentLevel, progress.xpToNextLevel) : null;
  return <View style={{ gap: 6 }}>
    <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
      <Text style={[s.small, { color: theme.violetDeep, fontFamily: typography.bodyExtraBold }]}>{zh ? '等级' : 'Level'} {progress?.currentLevel ?? level}</Text>
      {progress ? <Text style={s.small}>{metrics?.isMaxLevel ? (zh ? '已达最高等级' : 'Max level') : `${zh ? '下一级' : 'Next'}: ${progress.currentLevel + 1}`}</Text> : null}
    </View>
    {metrics ? <LearningProgress value={metrics.progress} total={100} color={theme.violetDeep} height={8} /> : query.isError ? <AnimatedPressable accessibilityRole="button" onPress={() => void query.refetch()} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={s.small}>{zh ? '等级进度暂不可用，点击重试' : 'Level progress unavailable. Tap to retry.'}</Text></AnimatedPressable> : <View accessibilityLabel={zh ? '正在读取等级进度' : 'Loading level progress'} style={{ height: 8, borderRadius: 99, backgroundColor: theme.violetTint }} />}
  </View>;
}
