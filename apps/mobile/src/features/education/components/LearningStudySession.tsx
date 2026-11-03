import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CompanionLearningPresence } from '@/features/profile/companion/CompanionLearningPresence';
import { LearningReadAloud } from './LearningReadAloud';
import { LearningStudyIllustration } from './LearningStudyIllustration';
import type { EducationPublicCourseDetail } from '../types/educationPractice.types';
import { LearningArrival, LearningButton, LearningProgress, useLearningCopy, useLearningStyles, useLearningTheme } from './LearningUi';

type StudyObjective = EducationPublicCourseDetail['objectives'][number];
export type LearningReadingPosition = { position: number; finished: boolean };

/** Local page position is reading navigation, never a server mastery/score update. */
export function LearningStudySession({ objective, onFinish, onMemory, practiceTitle, finishLabel, reading, onReadingChange }: {
  objective: StudyObjective;
  onFinish: () => void;
  onMemory: (id: string) => void;
  practiceTitle?: string;
  finishLabel?: string;
  reading: LearningReadingPosition;
  onReadingChange: (reading: LearningReadingPosition) => void;
}) {
  const { styles: s, theme: palette } = useLearningStyles();
  const theme = useLearningTheme();
  const { zh } = useLearningCopy();
  const { position, finished } = reading;
  const items = [...objective.studyItems].sort((a, b) => a.position - b.position);
  const index = Math.min(position, Math.max(0, items.length - 1));
  const item = items[index];
  const last = index === items.length - 1;
  const memory = objective.recommendedMemorySet;
  const summary = finished || !item;
  return <View style={{ flex: 1 }}>
    <ScrollView key={summary ? 'summary' : item.id} contentContainerStyle={[s.content, { paddingTop: 4, gap: 18 }]}>
      <View style={{ gap: 9 }}>
        <Text style={s.small}>{zh ? '学一点，再试一试' : 'Discover a little. Then try it.'}</Text>
        <LearningProgress value={finished ? items.length : index} total={items.length} />
        <Text style={s.small}>{summary ? (zh ? '准备好试一试了吗？' : 'Ready to try it?') : `${zh ? '要点' : 'Idea'} ${index + 1} / ${items.length}`}</Text>
      </View>
      {summary ? <LearningArrival style={[s.card, { alignItems: 'center', gap: 16 }]}>
        <CompanionLearningPresence state="thinking" />
        <Text accessibilityRole="header" style={s.title}>{item ? (zh ? '现在轮到你啦！' : 'Your turn to try!') : (zh ? '学习内容正在准备' : 'Study content is on its way')}</Text>
        <Text style={s.body}>{item ? (zh ? '刚刚看过的内容，能自己想起来吗？' : 'Can you recall what you just explored?') : (zh ? '先回到学习路径，看看可以做的练习。' : 'Return to the learning path to explore the available practice.')}</Text>
        {practiceTitle ? <Text style={[s.small, { color: palette.violetDeep }]}>{practiceTitle}</Text> : null}
        {items.length ? <AnimatedPressable accessibilityRole="button" onPress={() => onReadingChange({ position: 0, finished: false })} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={[s.small, { color: palette.violetDeep }]}>{zh ? '再看一遍学习卡片' : 'Look through the cards again'}</Text></AnimatedPressable> : null}
      </LearningArrival> : <LearningArrival style={{ gap: 14 }}>
        <LinearGradient colors={theme.gradient} start={[0, 0]} end={[1, 1]} style={{ padding: 24, borderRadius: 24, gap: 15, borderBottomWidth: 5, borderBottomColor: theme.line }}>
          <View style={[s.row, { gap: 10 }]}><Ionicons name="bulb-outline" size={25} color={theme.dark} /><Text style={[s.small, { color: theme.dark }]}>{zh ? '一起发现' : 'LET’S DISCOVER'}</Text></View>
          <Text accessibilityRole="header" style={[s.title, { color: theme.dark }]}>{item.primary}</Text>
          {item.phonetic ? <Text style={[s.body, { color: theme.dark }]}>{item.phonetic}</Text> : null}
          {item.languageCode ? <LearningReadAloud key={item.id} text={item.primary} language={item.languageCode} /> : null}
        </LinearGradient>
        <LearningStudyIllustration key={item.id} code={item.illustrationCode} />
        {item.secondary && item.secondary.trim() !== item.primary.trim() ? <View style={s.card}><Text style={s.body}>{item.secondary}</Text></View> : null}
        {item.extra && item.extra.trim() !== item.primary.trim() && item.extra.trim() !== item.secondary?.trim() ? <View style={[s.card, { backgroundColor: palette.violetTint }]}><Text style={[s.small, { color: palette.violetDeep }]}>{zh ? '再想一想' : 'A LITTLE MORE'}</Text><Text style={s.body}>{item.extra}</Text></View> : null}
      </LearningArrival>}
      {summary && memory ? <AnimatedPressable accessibilityRole="button" onPress={() => onMemory(memory.id)} style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <Ionicons name="sparkles-outline" size={26} color={palette.violetDeep} />
        <View style={{ flex: 1, gap: 5 }}><Text style={s.heading}>{zh ? '帮我记住 · 可选' : 'Help me remember · Optional'}</Text><Text style={s.body}>{memory.title}</Text><Text style={s.small}>{zh ? '可以稍后再试，不影响继续学习' : 'You can try this later and keep learning now'}</Text></View>
        <Ionicons name="chevron-forward" size={20} color={palette.violetDeep} />
      </AnimatedPressable> : null}
    </ScrollView>
    <View style={[s.dock, { gap: 10 }]}>
      {!summary && index > 0 ? <AnimatedPressable accessibilityRole="button" onPress={() => onReadingChange({ position: index - 1, finished: false })} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><Text style={[s.small, { color: palette.violetDeep }]}>{zh ? '← 上一个要点' : '← Previous idea'}</Text></AnimatedPressable> : null}
      <LearningButton label={summary ? finishLabel ?? (practiceTitle ? (zh ? '开始练习' : 'Start practice') : (zh ? '返回学习路径' : 'Back to the learning path')) : last ? (zh ? '看完了，试一试' : 'Ready to try') : (zh ? '下一个要点' : 'Next idea')}
        onPress={() => { if (summary) onFinish(); else onReadingChange({ position: last ? index : index + 1, finished: last }); }} />
    </View>
  </View>;
}
