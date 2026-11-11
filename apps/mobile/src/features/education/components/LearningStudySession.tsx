import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { LearningStudyNavigator } from './LearningStudyNavigator';
import { ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CompanionActor } from '@/features/profile/companion/CompanionActor';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { LearningStudyContentCard, isWordStudyCard } from './LearningStudyContentCard';
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
  const wordCard = !!item && isWordStudyCard(item);
  const cardsOnly = practiceQuestionCount === 0;
  return <View style={{ flex: 1 }}>
    <ScrollView key={summary ? 'summary' : item.id} contentContainerStyle={[s.content, { paddingTop: appSpacing.xs, gap: 18, flexGrow: 1 }]}>
      {summary ? <View style={{ gap: appSpacing.sm }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>{[...items.map(entry => entry.id), ...(cardsOnly ? [] : ['practice'])].map((key, step) => <View key={key} style={{ flex: 1, height: 8, borderRadius: appRadii.pill, backgroundColor: step < items.length ? palette.violetDeep : palette.line }} />)}</View>
        <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}><Text style={[s.small, { color: palette.violetDeep }]}>{items.length ? (zh ? '学习 · 已完成' : 'Study · Complete') : (zh ? '准备练习' : 'Practice ahead')}</Text><Text style={s.small}>{cardsOnly ? (zh ? '可以再看一遍' : 'Review anytime') : practiceQuestionCount !== undefined ? (zh ? `练习 · ${practiceQuestionCount} 题` : `Practice · ${practiceQuestionCount} questions`) : (zh ? '下一步 · 练习' : 'Next · Practice')}</Text></View>
      </View> : <View style={{ gap: 10 }}>
        <View style={[s.row, { justifyContent: 'space-between', gap: 10 }]}>
          <Text numberOfLines={2} style={[s.heading, { flex: 1, fontSize: appTextStyles.cardTitle.fontSize }]}>{objective.title}</Text>
          <View style={{ borderRadius: appRadii.control, backgroundColor: palette.violetTint, paddingHorizontal: 10, paddingVertical: 6 }}><Text style={[s.small, { color: palette.violetDeep }]}>{`${index + 1} / ${items.length}`}</Text></View>
        </View>
        <LearningProgress value={index + 1} total={items.length} />
      </View>}
      {summary ? <LearningArrival style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: appSpacing.lg, paddingVertical: 28 }}>
        <View style={{ alignItems: 'center', width: '100%', maxWidth: 320 }}>
          <View style={{ alignSelf: 'flex-end', maxWidth: '85%', borderWidth: 1.5, borderColor: palette.line, backgroundColor: palette.paper, borderRadius: appRadii.control, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 9 }}><Text style={[s.small, { color: palette.violetDeep }]}>{zh ? '慢慢想，我陪着你。' : 'Take your time. I’m right here.'}</Text></View>
          <CompanionActor stage={user?.level ?? 1} size={160} cue={{ action: 'think', sequence: 0 }} />
        </View>
        <Text accessibilityRole="header" style={[s.title, { textAlign: 'center' }]}>{cardsOnly ? (zh ? '这一组学完啦！' : 'You explored this set!') : item ? (zh ? '现在轮到你啦！' : 'Your turn to try!') : (zh ? '学习内容正在准备' : 'Study content is on its way')}</Text>
        <Text style={[s.body, { textAlign: 'center' }]}>{cardsOnly ? (zh ? '随时回来复习，也可以继续下一个单元。' : 'Come back to review anytime, or continue to the next unit.') : item ? (zh ? '刚刚看过的内容，能自己想起来吗？' : 'Can you recall what you just explored?') : (zh ? '先回到学习路径，看看可以做的练习。' : 'Return to the learning path to explore the available practice.')}</Text>
        {practiceTitle ? <View style={[s.row, { flexWrap: 'wrap', justifyContent: 'center', gap: appSpacing.sm }]}>
          {(practiceQuestionCount !== undefined ? [zh ? `${practiceQuestionCount} 道题` : `${practiceQuestionCount} questions`, zh ? `约 ${Math.ceil(practiceQuestionCount * .75)} 分钟` : `About ${Math.ceil(practiceQuestionCount * .75)} min`, zh ? '轻松练习，不计分' : 'Relaxed practice · Ungraded'] : [zh ? '轻松练习，不计分' : 'Relaxed practice · Ungraded']).map(label => <View key={label} style={{ paddingHorizontal: appSpacing.md, paddingVertical: 5, borderRadius: appRadii.pill, backgroundColor: palette.violetTint }}><Text style={[s.small, { color: palette.violetDeep }]}>{label}</Text></View>)}
        </View> : null}
      </LearningArrival> : <LearningArrival style={{ gap: 14, flexGrow: 1 }}>
        <LearningStudyContentCard key={`content-${item.id}`} item={item} />
        <LearningStudyIllustration key={`illustration-${item.id}`} code={item.illustrationCode} label={item.primary} />
        {wordCard ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: appSpacing.md, paddingHorizontal: appSpacing.xs }}>
          <CompanionActor stage={user?.level ?? 1} size={68} cue={{ action: 'think', sequence: 0 }} />
          <View style={{ flex: 1, gap: 3 }}><Text style={s.small}>{zh ? '和沫沫一起，慢慢记住它' : 'One little step with Momo'}</Text><Text style={[s.small, { color: palette.violetDeep }]}>{zh ? '看清词语，试着自己读出来。' : 'Look at the word and try saying it aloud.'}</Text></View>
        </View> : null}
      </LearningArrival>}
      {!summary && items.length > 1 ? <LearningStudyNavigator items={items} index={index} onSelect={position => onReadingChange({ position, finished: false })} /> : null}
      {summary && memory ? <AnimatedPressable accessibilityRole="button" onPress={() => onMemory(memory.id)} style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: appSpacing.md }]}>
        <Ionicons name="sparkles-outline" size={26} color={palette.violetDeep} />
        <View style={{ flex: 1, gap: 5 }}><Text style={s.heading}>{zh ? '帮我记住 · 可选' : 'Help me remember · Optional'}</Text><Text style={s.body}>{memory.title}</Text><Text style={s.small}>{zh ? '可以稍后再试，不影响继续学习' : 'You can try this later and keep learning now'}</Text></View>
        <Ionicons name="chevron-forward" size={20} color={palette.violetDeep} />
      </AnimatedPressable> : null}
    </ScrollView>
    <View style={[s.dock, { flexDirection: summary ? 'column' : 'row', alignItems: 'stretch', gap: appSpacing.md }]}>
      {summary && items.length ? <LearningButton secondary label={zh ? '再看一遍学习卡片' : 'Review the study cards'} onPress={() => onReadingChange({ position: 0, finished: false })} /> : null}
      {!summary && index > 0 ? <View style={{ flex: 1, minWidth: 0 }}>
        <LearningButton secondary label={zh ? '上一个要点' : 'Previous idea'} onPress={() => onReadingChange({ position: index - 1, finished: false })} />
      </View> : null}
      <View style={{ flex: summary ? undefined : 1, minWidth: 0 }}>
        <LearningButton label={summary ? finishLabel ?? (practiceTitle ? (zh ? '开始练习' : 'Start practice') : (zh ? '返回学习路径' : 'Back to the learning path')) : last ? (cardsOnly ? (zh ? '看完了' : 'Finish reading') : (zh ? '看完了，试一试' : 'Ready to try')) : (zh ? '下一个要点' : 'Next idea')}
          onPress={() => { if (summary) onFinish(); else onReadingChange({ position: last ? index : index + 1, finished: last }); }} />
      </View>
    </View>
  </View>;
}
