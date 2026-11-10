import { useState } from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useAuth } from '@/contexts/AuthProvider';
import { educationAssignmentApi } from '../api/educationAssignment.api';
import { LearningStudySession, type LearningReadingPosition } from './LearningStudySession';
import { LearningHeader } from './LearningHeader';
import { useLearningCopy, useLearningStyles } from './LearningUi';

export function EducationFamilyStudyPreparation({ assignmentId, disabled }: { assignmentId: string; disabled: boolean }) {
  const { user } = useAuth();
  const { zh } = useLearningCopy();
  const { styles: s, theme } = useLearningStyles();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [objectiveIndex, setObjectiveIndex] = useState(0);
  const [reading, setReading] = useState<LearningReadingPosition>({ position: 0, finished: false });
  const content = useQuery({
    queryKey: ['education', 'family-study', user?.id, assignmentId],
    queryFn: () => educationAssignmentApi.getFamilyStudyItems(assignmentId),
    enabled: !!user?.id && focused && !disabled,
    retry: false,
  });
  const objectives = content.data ?? [];
  const objective = objectives[objectiveIndex];
  if (disabled) return null;
  if (content.isPending) return <View style={s.row}><ActivityIndicator color={theme.violetDeep} /><Text style={s.small}>{zh ? '正在准备学习卡片…' : 'Preparing study cards…'}</Text></View>;
  if (content.isError) return <View style={{ gap: 8 }}><Text accessibilityRole="alert" style={s.small}>{zh ? '学习卡片暂时未能加载，可以重试或直接开始作答。' : 'Study cards could not load. Retry or start the task below.'}</Text>
    <AnimatedPressable accessibilityRole="button" onPress={() => void content.refetch()} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={[s.small, { color: theme.violetDeep }]}>{zh ? '重新加载学习卡片' : 'Retry study cards'}</Text></AnimatedPressable></View>;
  if (!objectives.length) return null;
  return <>
    <AnimatedPressable accessibilityRole="button" onPress={() => setOpen(true)} style={[s.card, { backgroundColor: theme.violetTint, gap: 8 }]}>
      <Text style={[s.heading, { color: theme.violetDeep }]}>{zh ? '先学一学' : 'Explore before you begin'}</Text>
      <Text style={s.body}>{zh ? `${objectives.length} 个知识点 · 看卡片、听朗读，再自己试一试。` : `${objectives.length} learning points · Explore the cards before trying the task.`}</Text>
      <Text style={s.small}>{zh ? '不会开始答题计时，也不计入成绩' : 'Does not start the task timer or affect your score'}</Text>
    </AnimatedPressable>
    <Modal visible={open && focused} animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, backgroundColor: theme.paper, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <LearningHeader title={objective?.title ?? (zh ? '学习卡片' : 'Study cards')} backAction={() => setOpen(false)} />
        {open && focused && objective && <LearningStudySession objective={{ ...objective, recommendedMemorySet: null }}
          reading={reading} onReadingChange={setReading} onMemory={() => {}}
          finishLabel={objectiveIndex + 1 < objectives.length ? (zh ? '下一个知识点' : 'Next learning point') : (zh ? '准备好了，返回任务' : 'Ready — return to the task')}
          onFinish={() => {
            setReading({ position: 0, finished: false });
            if (objectiveIndex + 1 < objectives.length) setObjectiveIndex(objectiveIndex + 1);
            else { setObjectiveIndex(0); setOpen(false); }
          }} />}
      </View>
    </Modal>
  </>;
}
