import { CompanionLearningPresence } from '@/features/profile/companion/CompanionLearningPresence';
import AnimatedPressable from '@/components/AnimatedPressable';
import { Ionicons } from '@expo/vector-icons';
import { useReducedMotion } from 'react-native-reanimated';
import { useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { EducationGuidedCourseProgress, EducationPublicCourseDetail } from '../types/educationPractice.types';
import { LearningArrival, LearningButton, useLearningStyles, useLearningCopy, useLearningTheme } from './LearningUi';

export function LearningCoursePath({ objectives, progress, onMemory, onPractice }: {
  objectives: EducationPublicCourseDetail['objectives']; progress?: EducationGuidedCourseProgress; onMemory: (id: string) => void; onPractice?: (assessmentId: string) => void;
}) {
  const { styles: s, theme: palette } = useLearningStyles();
  const reduceMotion = useReducedMotion();
  const ui = useLearningCopy(); const theme = useLearningTheme(); const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = objectives.find(item => item.id === selectedId);
  return <View style={{ gap: 14 }}>
    <Text accessibilityRole="header" style={[s.heading, { fontSize: 20, lineHeight: 27 }]}>{ui.path}</Text>
    {objectives.length === 0 ? <View style={s.card}><CompanionLearningPresence state="thinking" /><Text style={s.body}>{ui.zh ? '知识点还在准备中，可以先看看下方的测评练习。' : 'Study points are being prepared. Explore the practice lessons below.'}</Text></View> : null}
    {objectives.map((objective, index) => {
      const lessons = progress?.lessons.filter(lesson => lesson.objectives.some(item => item.objectiveId === objective.id));
      const done = !!lessons?.length && lessons.every(lesson => lesson.isComplete);
      const pending = done && !!lessons?.some(lesson => lesson.questionsSolved < lesson.questionCount);
      const current = !done && (lessons?.some(lesson => lesson.assessmentId === progress?.nextRecommendedAssessmentId) || (!progress?.nextRecommendedAssessmentId && index === 0));
      const summary = objective.studyItems.find(item => item.primary.trim() !== objective.title.trim());
      const practiceLesson = lessons?.[0];
      return <LearningArrival key={objective.id} style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 42, alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 3, backgroundColor: done ? palette.successText : current ? palette.violetDeep : palette.disabled, borderColor: done ? palette.mintLine : palette.line, alignItems: 'center', justifyContent: 'center' }}><Text style={[s.heading, { color: palette.onAccent }]}>{done ? '✓' : index + 1}</Text></View>
          {index < objectives.length - 1 ? <View style={{ width: 6, backgroundColor: palette.line, flex: 1, minHeight: 30, marginTop: 6 }} /> : null}
        </View>
        <View style={[s.card, { flex: 1, minWidth: 0, marginBottom: 10 }]}>
          <Text accessibilityRole="header" style={s.heading}>{objective.title}</Text>
          {summary ? <Text numberOfLines={2} style={s.body}>{summary.primary}</Text> : null}
          {current || done || objective.recommendedMemorySet ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            {current ? <View style={{ backgroundColor: palette.violetTint, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={[s.small, { color: palette.violetDeep }]}>{ui.underway}</Text></View> : null}
            {done ? <View style={{ backgroundColor: palette.mintTint, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={[s.small, { color: palette.successText }]}>✓ {ui.done}</Text></View> : null}
            {pending ? <View style={{ backgroundColor: palette.peachTint, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={[s.small, { color: palette.ink }]}>{ui.reinforce}</Text></View> : null}
            {objective.recommendedMemorySet ? <AnimatedPressable accessibilityLabel={`${ui.recommended}: ${objective.recommendedMemorySet.title}`} onPress={() => onMemory(objective.recommendedMemorySet!.id)} style={{ minHeight: 44, justifyContent: 'center' }}><View style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: palette.violetTint }}><Text style={[s.small, { color: palette.violetDeep }]}>{objective.recommendedMemorySet.techniqueKey === 'palace' ? '🏛️' : '🔢'} {ui.recommended}{ui.zh ? objective.recommendedMemorySet.techniqueKey === 'palace' ? '宫殿' : '数字桩' : ` · ${objective.recommendedMemorySet.techniqueKey === 'palace' ? 'Palace' : 'Number Peg'}`}</Text></View></AnimatedPressable> : null}
          </View> : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><LearningButton compact secondary label={ui.content} onPress={() => setSelectedId(objective.id)} /></View>
            {practiceLesson && onPractice ? <View style={{ flex: 1 }}><LearningButton compact label={ui.practice} onPress={() => onPractice(practiceLesson.assessmentId)} /></View> : null}
          </View>
          {!objective.recommendedMemorySet ? <Text style={s.small}>{ui.noMemory}</Text> : null}
        </View>
      </LearningArrival>;
    })}
    <Modal visible={!!selected} animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={() => setSelectedId(null)}>
      <View style={[s.page, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={[s.row, { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14 }]}><View style={{ flex: 1, gap: 2 }}><Text style={[s.small, { color: palette.violetDeep, letterSpacing: 1 }]}>{ui.zh ? '学习内容' : 'STUDY CONTENT'}</Text><Text numberOfLines={1} style={[s.heading, { flex: 1 }]}>{selected?.title}</Text></View><AnimatedPressable accessibilityLabel={ui.close} onPress={() => setSelectedId(null)} style={{ minHeight: 44, width: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={26} color={palette.ink} /></AnimatedPressable></View>
        <ScrollView contentContainerStyle={[s.content, { paddingTop: 4 }]}>
          {selected && selected.studyItems.length === 0 ? <View style={[s.card, { backgroundColor: palette.violetTint, borderColor: palette.violetLine }]}><CompanionLearningPresence state="thinking" /><Text style={s.body}>{ui.zh ? '学习内容还在准备中。' : 'Study content is being prepared.'}</Text></View> : null}
          {selected?.studyItems.map((item, index) => <View key={item.id} style={{ backgroundColor: palette.violetTint, borderRadius: 16, padding: 12, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 36, height: 36, borderRadius: 13, backgroundColor: theme.tint, borderColor: theme.line, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' }}><Text style={[s.small, { color: theme.dark }]}>{index + 1}</Text></View><Text style={[s.small, { color: palette.violetDeep }]}>{ui.zh ? `要点 ${index + 1}` : `KEY IDEA ${index + 1}`}</Text></View>
            {item.primary.trim() !== selected.title.trim() ? <Text style={[s.body, { color: palette.ink, fontSize: 14, lineHeight: 23 }]}>{item.primary}</Text> : null}
            {item.phonetic ? <View style={{ alignSelf: 'flex-start', backgroundColor: theme.tint, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 6 }}><Text style={[s.body, { color: theme.dark }]}>{item.phonetic}</Text></View> : null}
            {item.secondary && item.secondary.trim() !== item.primary.trim() ? <Text style={[s.body, { backgroundColor: palette.violetTint, borderRadius: 14, padding: 12 }]}>{item.secondary}</Text> : null}
            {item.extra && item.extra.trim() !== item.primary.trim() && item.extra.trim() !== item.secondary?.trim() ? <Text style={[s.body, { borderLeftWidth: 3, borderLeftColor: theme.color, paddingLeft: 11 }]}>{item.extra}</Text> : null}
          </View>)}
        </ScrollView>
        <View style={s.dock}><LearningButton label={ui.zh ? '完成阅读' : 'Done reading'} onPress={() => setSelectedId(null)} /></View>
      </View>
    </Modal>
  </View>;
}
