import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useUserState } from '@/contexts/UserStateContext';
import { usePracticeStats } from '@/features/practice-attempts';
import { LearningChoiceMenu } from './LearningChoiceMenu';
import { LearningProgress, useLearningCopy, useLearningStyles } from './LearningUi';

export function LearningDailyGoal() {
  const { styles: s, theme } = useLearningStyles(); const { zh } = useLearningCopy();
  const { userState, updateState } = useUserState(); const stats = usePracticeStats(); const { refetch } = stats;
  const [error, setError] = useState(false);
  useFocusEffect(useCallback(() => { void refetch(); }, [refetch]));
  const goal = userState.preferences.dailyMemoryGoal ?? 1;
  const day = new Date().toISOString().slice(0, 10);
  const count = stats.data?.weeklyActivity.find(item => item.date.slice(0, 10) === day)?.sessions ?? 0;
  const ready = stats.isSuccess; const done = ready && count >= goal;
  return <View style={{ gap: 8 }}>
    <View style={[s.row, { justifyContent: 'space-between' }]}>
      <View style={[s.row, { flex: 1 }]}><Ionicons name={done ? 'checkmark-circle' : 'flag-outline'} size={21} color={done ? theme.successText : theme.violetDeep} /><Text style={s.heading}>{zh ? '每日记忆目标' : 'Daily memory goal'}</Text></View>
      <LearningChoiceMenu value={String(goal)} label={zh ? `${goal} 次／天` : `${goal} / day`} title={zh ? '选择每天的记忆练习次数' : 'Choose your daily memory practice goal'} options={[1, 3, 5].map(value => ({ value: String(value), label: zh ? `每天 ${value} 次练习` : `${value} sessions a day` }))}
        onChange={value => { setError(false); void updateState(current => ({ preferences: { ...current.preferences, dailyMemoryGoal: Number(value) as 1 | 3 | 5 } })).catch(() => setError(true)); }} />
    </View>
    <LearningProgress value={ready ? Math.min(count, goal) : 0} total={goal} color={done ? theme.successText : theme.violetDeep} height={8} />
    <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.small, { flex: 1 }]}>{done ? (zh ? '今天的目标完成了！' : 'Today’s goal is complete!') : (zh ? '完成一次记忆练习，向前一小步' : 'One memory session. One step forward.')}</Text><Text style={s.small}>{ready ? `${count}/${goal}` : '…'} · UTC</Text></View>
    {stats.isError ? <AnimatedPressable onPress={() => void stats.refetch()} style={{ minHeight: 44, justifyContent: 'center' }}><Text accessibilityRole="alert" style={s.small}>{zh ? '次数暂时无法更新，点击重试' : 'Could not refresh your count. Tap to retry.'}</Text></AnimatedPressable> : null}
    {error ? <Text accessibilityRole="alert" style={s.small}>{zh ? '目标未保存，请重新选择。' : 'Goal was not saved. Please select it again.'}</Text> : null}
  </View>;
}
