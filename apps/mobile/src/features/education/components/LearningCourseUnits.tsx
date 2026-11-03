import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LearningCoursePath } from './LearningCoursePath';
import { useLearningCopy, useLearningStyles, useLearningTheme } from './LearningUi';
import { groupCourseObjectives } from '../utils/educationCourseUnits';
import type { EducationGuidedCourseProgress, EducationPublicCourseDetail } from '../types/educationPractice.types';

export function LearningCourseUnits({ course, progress, onMemory, onPractice }: {
  course: EducationPublicCourseDetail;
  progress?: EducationGuidedCourseProgress;
  onMemory: (id: string) => void;
  onPractice: (assessmentId: string, studiedObjectiveId?: string) => void;
}) {
  const { styles: s } = useLearningStyles();
  const theme = useLearningTheme();
  const { zh, path } = useLearningCopy();
  const groups = groupCourseObjectives(course);
  return <View style={{ gap: 18 }}>
    <Text accessibilityRole="header" style={s.heading}>{path}</Text>
    {groups.map((group, index) => <View key={group.id} style={{ gap: 14 }}>
      {group.title ? <LinearGradient colors={theme.gradient} style={{ padding: 18, borderRadius: 22, gap: 6 }}>
        <Text style={[s.small, { color: theme.dark }]}>{zh ? `单元 ${index + 1}` : `UNIT ${index + 1}`}</Text>
        <Text accessibilityRole="header" style={[s.heading, { color: theme.dark }]}>{group.title}</Text>
        <Text style={[s.small, { color: theme.dark }]}>{zh ? `${group.objectives.length} 个知识点 · 一步步探索` : `${group.objectives.length} study points · One step at a time`}</Text>
      </LinearGradient> : groups.length > 1 ? <Text accessibilityRole="header" style={s.heading}>{zh ? '更多学习内容' : 'More to discover'}</Text> : null}
      <LearningCoursePath objectives={group.objectives} progress={progress} onMemory={onMemory} onPractice={onPractice} showHeading={false} />
    </View>)}
  </View>;
}
