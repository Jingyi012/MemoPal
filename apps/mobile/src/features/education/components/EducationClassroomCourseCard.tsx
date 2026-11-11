import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AnimatedPressable from '@/components/AnimatedPressable';
import type { EducationClassroomCourse } from '../types/educationRelationship.types';
import { useEducationCopy } from '../i18n';
import { learningThemeFor, useLearningCopy, useLearningStyles } from './LearningUi';

export function EducationClassroomCourseCard({ course, onOpen }: { course: EducationClassroomCourse; onOpen: () => void }) {
  const { styles: s, theme } = useLearningStyles();
  const subject = learningThemeFor(course.title, theme);
  const { zh } = useLearningCopy();
  const copy = useEducationCopy();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width / fontScale < 380;
  const contents = <>
    <View style={{ backgroundColor: theme.violetTint, borderRadius: appRadii.card, padding: appSpacing.lg, gap: appSpacing.md }}>
      <View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'flex-start' : 'center', gap: appSpacing.md }}>
        <View style={{ borderRadius: appRadii.control, padding: stacked ? 8 : 12, backgroundColor: theme.paper }}><Ionicons name={subject.icon} size={stacked ? 24 : 28} color={subject.color} /></View>
        <Text accessibilityRole="header" style={[s.title, { flex: stacked ? undefined : 1, alignSelf: 'stretch', color: subject.dark, fontSize: appTextStyles.screenTitle.fontSize }]}>{course.title}</Text>
      </View>
      <Text style={[s.small, { color: subject.dark }]}>{zh ? `${course.objectives.length} 个知识点` : `${course.objectives.length} learning objectives`}</Text>
    </View>
    <View style={{ gap: appSpacing.md, paddingHorizontal: appSpacing.xs, paddingBottom: appSpacing.xs }}>
      <Text style={s.body}>{course.guidedPracticeEnabled ? copy.classroomLearningCourseHint : copy.classroomLearningNotOpen}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name={course.guidedPracticeEnabled ? 'play-circle-outline' : 'time-outline'} size={23} color={subject.color} />
        <Text style={[s.heading, { flex: 1, color: subject.color }]}>{course.guidedPracticeEnabled ? copy.classroomLearningOpen : (zh ? '等待老师开放' : 'Waiting for your teacher')}</Text>
        {course.guidedPracticeEnabled ? <Ionicons name="arrow-forward" size={21} color={subject.color} /> : null}
      </View>
    </View>
  </>;
  return course.guidedPracticeEnabled
    ? <AnimatedPressable accessibilityRole="button" accessibilityLabel={`${course.title}, ${copy.classroomLearningOpen}`} onPress={onOpen} style={[s.card, { padding: 10, gap: 14, borderColor: subject.line }]}>{contents}</AnimatedPressable>
    : <View style={[s.card, { padding: 10, gap: 14, borderColor: subject.line }]}>{contents}</View>;
}
