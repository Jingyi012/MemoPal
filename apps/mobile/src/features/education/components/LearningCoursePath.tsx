import { CompanionLearningPresence } from '@/features/profile/companion/CompanionLearningPresence';
import AnimatedPressable from '@/components/AnimatedPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useReducedMotion } from 'react-native-reanimated';
import { useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { EducationGuidedCourseProgress, EducationPublicCourseDetail } from '../types/educationPractice.types';
import { LearningStudySession, type LearningReadingPosition } from './LearningStudySession';
import { chooseObjectiveLesson } from '../utils/educationObjectiveLesson';
import { LearningArrival, LearningButton, useLearningStyles, useLearningCopy } from './LearningUi';

export function LearningCoursePath({ objectives, progress, onMemory, onPractice, showHeading = true, sharedAssessmentIds = [] }: {
  objectives: EducationPublicCourseDetail['objectives']; progress?: EducationGuidedCourseProgress; onMemory: (id: string) => void; onPractice?: (assessmentId: string, studiedObjectiveId?: string) => void;
  showHeading?: boolean;
  sharedAssessmentIds?: readonly string[];
}) {
  const { styles: s, theme: palette } = useLearningStyles();
  const reduceMotion = useReducedMotion();
  const ui = useLearningCopy(); const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reading, setReading] = useState<LearningReadingPosition>({ position: 0, finished: false });
  const focused = useIsFocused();
  const selected = objectives.find(item => item.id === selectedId);
  const selectedLesson = selected ? chooseObjectiveLesson(selected.id, progress) : undefined;
  return <View style={{ gap: 14 }}>
    {showHeading ? <Text accessibilityRole="header" style={[s.heading, { fontSize: 20, lineHeight: 27 }]}>{ui.path}</Text> : null}
    {objectives.length === 0 ? <View style={s.card}><CompanionLearningPresence state="thinking" /><Text style={s.body}>{ui.zh ? '知识点还在准备中，可以先看看下方的测评练习。' : 'Study points are being prepared. Explore the practice lessons below.'}</Text></View> : null}
    {objectives.map((objective, index) => {
      const lessons = progress?.lessons.filter(lesson => lesson.objectives.some(item => item.objectiveId === objective.id));
      const done = !!lessons?.length && lessons.every(lesson => lesson.isComplete);
      const pending = !!lessons?.some(lesson => lesson.latestIncorrectQuestionCount > 0);
      const started = !!lessons?.some(lesson => lesson.isStarted);
      const current = !done && (lessons?.some(lesson => lesson.assessmentId === progress?.nextRecommendedAssessmentId) || (!progress?.nextRecommendedAssessmentId && index === 0));
      const summary = objective.studyItems.find(item => item.primary.trim() !== objective.title.trim());

      return <LearningArrival key={objective.id} style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 42, alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 3, backgroundColor: done ? palette.successText : current ? palette.violetDeep : palette.disabled, borderColor: done ? palette.mintLine : palette.line, alignItems: 'center', justifyContent: 'center' }}><Text style={[s.heading, { color: done || current ? palette.onAccent : palette.inkSoft }]}>{done ? '✓' : index + 1}</Text></View>
          {index < objectives.length - 1 ? <View style={{ width: 6, backgroundColor: palette.line, flex: 1, minHeight: 30, marginTop: 6 }} /> : null}
        </View>
        <View style={[s.card, { flex: 1, minWidth: 0, marginBottom: 10 }]}>
          <Text accessibilityRole="header" style={s.heading}>{objective.title}</Text>
          {summary ? <Text numberOfLines={2} style={s.body}>{summary.primary}</Text> : null}
          {current || done || pending ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            {current ? <View style={{ backgroundColor: palette.violetTint, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={[s.small, { color: palette.violetDeep }]}>{started ? ui.underway : (ui.zh ? '从这里开始' : 'Start here')}</Text></View> : null}
            {done ? <View style={{ backgroundColor: palette.mintTint, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={[s.small, { color: palette.successText }]}>✓ {ui.done}</Text></View> : null}
            {pending ? <View style={{ backgroundColor: palette.peachTint, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={[s.small, { color: palette.ink }]}>{ui.reinforce}</Text></View> : null}

          </View> : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><LearningButton compact secondary label={ui.content} onPress={() => { setReading({ position: 0, finished: false }); setSelectedId(objective.id); }} /></View>

          </View>
          {onPractice ? lessons?.filter(lesson => !sharedAssessmentIds.includes(lesson.assessmentId)).map((lesson, lessonIndex) => <AnimatedPressable key={lesson.assessmentId} accessibilityRole="button" onPress={() => onPractice(lesson.assessmentId)} style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderColor: palette.line }}>
            <Ionicons name={lesson.isComplete ? 'checkmark-circle' : 'play-circle-outline'} size={24} color={lesson.isComplete ? palette.successText : palette.violetDeep} />
            <View style={{ flex: 1, gap: 3 }}><Text style={s.body}>{lessonIndex + 1}. {lesson.assessmentTitle}</Text><Text style={s.small}>{ui.correct(lesson.questionsSolved, lesson.questionCount)}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={palette.violetDeep} />
          </AnimatedPressable>) : null}
        </View>
      </LearningArrival>;
    })}
    <Modal visible={focused && !!selected} animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={() => setSelectedId(null)}>
      <View style={[s.page, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={[s.row, { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14 }]}><View style={{ flex: 1, gap: 2 }}><Text style={[s.small, { color: palette.violetDeep, letterSpacing: 1 }]}>{ui.zh ? '学习内容' : 'STUDY CONTENT'}</Text><Text numberOfLines={1} style={s.heading}>{selected?.title}</Text></View><AnimatedPressable accessibilityLabel={ui.close} onPress={() => setSelectedId(null)} style={{ minHeight: 44, width: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={26} color={palette.ink} /></AnimatedPressable></View>
        {selected ? <LearningStudySession key={selected.id} objective={selected} reading={reading} onReadingChange={setReading} practiceTitle={onPractice ? selectedLesson?.assessmentTitle : undefined} onFinish={() => { setSelectedId(null); if (selectedLesson && onPractice) onPractice(selectedLesson.assessmentId, selected.id); }} onMemory={onMemory} /> : null}
      </View>
    </Modal>
  </View>;
}
