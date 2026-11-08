import { ScrollView, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CompanionActor } from '@/features/profile/companion/CompanionActor';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { LearningStudyContentCard } from './LearningStudyContentCard';
import { LearningStudyIllustration } from './LearningStudyIllustration';
import type { EducationPublicCourseDetail } from '../types/educationPractice.types';
import { LearningArrival, LearningButton, LearningProgress, useLearningCopy, useLearningStyles } from './LearningUi';

type StudyObjective = EducationPublicCourseDetail['objectives'][number];
export type LearningReadingPosition = { position: number; finished: boolean };

/** Local page position is reading navigation, never a server mastery/score update. */
export function LearningStudySession({ objective, onFinish, onMemory, practiceTitle, practiceQuestionCount, finishLabel, reading, onReadingChange }: {
  objective: StudyObjective;
  onFinish: () => void;
  onMemory: (id: string) => void;
  practiceTitle?: string;
  practiceQuestionCount?: number;
  finishLabel?: string;
  reading: LearningReadingPosition;
  onReadingChange: (reading: LearningReadingPosition) => void;
}) {
  const { styles: s, theme: palette } = useLearningStyles();
  const { zh } = useLearningCopy();
  const { user } = useCurrentUser();
  const { position, finished } = reading;
  const items = [...objective.studyItems].sort((a, b) => a.position - b.position);
  const index = Math.min(position, Math.max(0, items.length - 1));
  const item = items[index];
  const last = index === items.length - 1;
  const memory = objective.recommendedMemorySet;
  const summary = finished || !item;
  return <View style={{ flex: 1 }}>
    <ScrollView key={summary ? 'summary' : item.id} contentContainerStyle={[s.content, { paddingTop: 4, gap: 18, flexGrow: summary ? 1 : undefined }]}>
      {summary ? <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>{[...items.map(entry => entry.id), 'practice'].map((key, step) => <View key={key} style={{ flex: 1, height: 8, borderRadius: 99, backgroundColor: step < items.length ? palette.violetDeep : palette.line }} />)}</View>
        <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}><Text style={[s.small, { color: palette.violetDeep }]}>{items.length ? (zh ? '学习 · 已完成' : 'Study · Complete') : (zh ? '准备练习' : 'Practice ahead')}</Text><Text style={s.small}>{practiceQuestionCount !== undefined ? (zh ? `练习 · ${practiceQuestionCount} 题` : `Practice · ${practiceQuestionCount} questions`) : (zh ? '下一步 · 练习' : 'Next · Practice')}</Text></View>
      </View> : <View style={[s.row, { gap: 10 }]}>
        <View style={{ flex: 1 }}><LearningProgress value={index + 1} total={items.length} /></View>
        <Text style={s.small}>{`${index + 1} / ${items.length}`}</Text>
      </View>}
      {summary ? <LearningArrival style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 28 }}>
        <View style={{ alignItems: 'center', width: '100%', maxWidth: 320 }}>
          <View style={{ alignSelf: 'flex-end', maxWidth: '85%', borderWidth: 1.5, borderColor: palette.line, backgroundColor: palette.paper, borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 9 }}><Text style={[s.small, { color: palette.violetDeep }]}>{zh ? '慢慢想，我陪着你。' : 'Take your time. I’m right here.'}</Text></View>
          <CompanionActor stage={user?.level ?? 1} size={160} cue={{ action: 'think', sequence: 0 }} />
        </View>
        <Text accessibilityRole="header" style={[s.title, { textAlign: 'center' }]}>{item ? (zh ? '现在轮到你啦！' : 'Your turn to try!') : (zh ? '学习内容正在准备' : 'Study content is on its way')}</Text>
        <Text style={[s.body, { textAlign: 'center' }]}>{item ? (zh ? '刚刚看过的内容，能自己想起来吗？' : 'Can you recall what you just explored?') : (zh ? '先回到学习路径，看看可以做的练习。' : 'Return to the learning path to explore the available practice.')}</Text>
        {practiceTitle ? <View style={[s.row, { flexWrap: 'wrap', justifyContent: 'center', gap: 8 }]}>
          {(practiceQuestionCount !== undefined ? [zh ? `${practiceQuestionCount} 道题` : `${practiceQuestionCount} questions`, zh ? `约 ${Math.ceil(practiceQuestionCount * .75)} 分钟` : `About ${Math.ceil(practiceQuestionCount * .75)} min`, zh ? '轻松练习，不计分' : 'Relaxed practice · Ungraded'] : [zh ? '轻松练习，不计分' : 'Relaxed practice · Ungraded']).map(label => <View key={label} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, backgroundColor: palette.violetTint }}><Text style={[s.small, { color: palette.violetDeep }]}>{label}</Text></View>)}
        </View> : null}
      </LearningArrival> : <LearningArrival style={{ gap: 14 }}>
        <LearningStudyContentCard item={item} />
        <LearningStudyIllustration key={item.id} code={item.illustrationCode} label={item.primary} />
      </LearningArrival>}
      {summary && memory ? <AnimatedPressable accessibilityRole="button" onPress={() => onMemory(memory.id)} style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <Ionicons name="sparkles-outline" size={26} color={palette.violetDeep} />
        <View style={{ flex: 1, gap: 5 }}><Text style={s.heading}>{zh ? '帮我记住 · 可选' : 'Help me remember · Optional'}</Text><Text style={s.body}>{memory.title}</Text><Text style={s.small}>{zh ? '可以稍后再试，不影响继续学习' : 'You can try this later and keep learning now'}</Text></View>
        <Ionicons name="chevron-forward" size={20} color={palette.violetDeep} />
      </AnimatedPressable> : null}
    </ScrollView>
    <View style={[s.dock, { flexDirection: summary ? 'column' : 'row', alignItems: 'stretch', gap: 12 }]}>
      {summary && items.length ? <LearningButton secondary label={zh ? '再看一遍学习卡片' : 'Review the study cards'} onPress={() => onReadingChange({ position: 0, finished: false })} /> : null}
      {!summary && index > 0 ? <View style={{ flex: 1, minWidth: 0 }}>
        <LearningButton secondary label={zh ? '上一个要点' : 'Previous idea'} onPress={() => onReadingChange({ position: index - 1, finished: false })} />
      </View> : null}
      <View style={{ flex: summary ? undefined : 1, minWidth: 0 }}>
        <LearningButton label={summary ? finishLabel ?? (practiceTitle ? (zh ? '开始练习' : 'Start practice') : (zh ? '返回学习路径' : 'Back to the learning path')) : last ? (zh ? '看完了，试一试' : 'Ready to try') : (zh ? '下一个要点' : 'Next idea')}
          onPress={() => { if (summary) onFinish(); else onReadingChange({ position: last ? index : index + 1, finished: last }); }} />
      </View>
    </View>
  </View>;
}
