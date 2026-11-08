import { Text, View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { Ionicons } from '@expo/vector-icons';
import { LearningCoursePath } from './LearningCoursePath';
import { useLearningCopy, useLearningStyles, useLearningTheme } from './LearningUi';
import { getCrossObjectiveLessons, groupCourseObjectives } from '../utils/educationCourseUnits';
import type { EducationGuidedCourseProgress, EducationPublicCourseDetail } from '../types/educationPractice.types';

export function LearningCourseUnits({ course, progress, onMemory, onPractice }: {
  course: EducationPublicCourseDetail;
  progress?: EducationGuidedCourseProgress;
  onMemory: (id: string) => void;
  onPractice: (assessmentId: string, studiedObjectiveId?: string) => void;
}) {
  const { styles: s, theme: palette } = useLearningStyles();
  const theme = useLearningTheme();
  const { zh, path } = useLearningCopy();
  const groups = groupCourseObjectives(course);
  const sharedLessons = getCrossObjectiveLessons(progress?.lessons ?? [], course.objectives.map(item => item.id));
  return <View style={{ gap: 18 }}>
    <Text accessibilityRole="header" style={s.heading}>{path}</Text>
    {groups.map((group, index) => <View key={group.id} style={{ gap: 14 }}>
      {group.title ? <View style={{ backgroundColor: theme.tint, padding: 18, borderRadius: 22, gap: 6 }}>
        <Text style={[s.small, { color: theme.dark }]}>{zh ? `单元 ${index + 1}` : `UNIT ${index + 1}`}</Text>
        <Text accessibilityRole="header" style={[s.heading, { color: theme.dark }]}>{group.title}</Text>
        <Text style={[s.small, { color: theme.dark }]}>{zh ? `${group.objectives.length} 个知识点 · 一步步探索` : `${group.objectives.length} study points · One step at a time`}</Text>
      </View> : groups.length > 1 ? <Text accessibilityRole="header" style={s.heading}>{zh ? '更多学习内容' : 'More to discover'}</Text> : null}
      <LearningCoursePath objectives={group.objectives} progress={progress} onMemory={onMemory} onPractice={onPractice} sharedAssessmentIds={sharedLessons.map(lesson => lesson.assessmentId)} showHeading={false} />
    </View>)}
    {sharedLessons.length ? <View style={{ gap: 12 }}>
      <Text accessibilityRole="header" style={s.heading}>{zh ? '综合练习' : 'Put it together'}</Text>
      <Text style={s.body}>{zh ? '把学过的知识点一起用一用。' : 'Bring the ideas you have explored together.'}</Text>
      {sharedLessons.map(lesson => <AnimatedPressable key={lesson.assessmentId} accessibilityRole="button" onPress={() => onPractice(lesson.assessmentId)} style={[s.card, { gap: 10 }]}>
        <View style={s.row}><Ionicons name={lesson.isComplete ? 'checkmark-circle-outline' : 'trophy-outline'} size={26} color={palette.violetDeep} /><Text style={[s.heading, { flex: 1 }]}>{lesson.assessmentTitle}</Text><Ionicons name="chevron-forward" size={20} color={palette.violetDeep} /></View>
        <Text style={s.body}>{lesson.objectives.map(item => item.objectiveTitle).join(' · ')}</Text>
        <Text style={s.small}>{zh ? `已答对 ${lesson.questionsSolved}/${lesson.questionCount}` : `${lesson.questionsSolved}/${lesson.questionCount} solved`}</Text>
      </AnimatedPressable>)}
    </View> : null}
  </View>;
}
