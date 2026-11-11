import { AppText as Text } from '@/components/ui/AppText';
import { appSpacing, appTextStyles } from '@/theme/designSystem';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Href, useRouter } from 'expo-router';
import AnimatedPressable from '@/components/AnimatedPressable';
import { createLearningStyles, learningTypography as type } from '../theme/learningTheme';
import { LearningCourseCover } from './LearningCourseCover';
import { useLearningCopy } from './LearningUi';
import type { EducationPublicCourseSummary } from '../types/educationPractice.types';

export function LearningDiscoverySections({ courses, recommended, fallback }: { courses: readonly EducationPublicCourseSummary[]; recommended?: EducationPublicCourseSummary; fallback: boolean }) {
  const { styles: s } = useStyles(); const { zh } = useLearningCopy(); const router = useRouter(); const { width } = useWindowDimensions();
  const open = (id: string) => router.push(`/community/education/${encodeURIComponent(id)}` as Href);
  const recent = [...courses].filter(course => Number.isFinite(Date.parse(course.publishedAt))).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 5);
  return <View style={s.sections}>
    {recommended ? <View style={s.section}><Text accessibilityRole="header" style={s.heading}>{zh ? (fallback ? '不妨试试这门课' : '为你挑选') : fallback ? 'Try something new' : 'Picked for you'}</Text>
      <AnimatedPressable onPress={() => open(recommended.id)} accessibilityLabel={recommended.title} style={s.feature}>
        <LearningCourseCover course={recommended} />
        <Text style={s.meta}>{recommended.authorDisplayName} · {recommended.assessmentCount} {zh ? '个练习' : 'practices'} · {recommended.questionCount} {zh ? '题' : 'questions'}</Text>
      </AnimatedPressable>
    </View> : null}
    {recent.length > 1 ? <View style={s.section}><Text accessibilityRole="header" style={s.heading}>{zh ? '最近上架' : 'Recently published'}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rail}>
        {recent.map(course => <AnimatedPressable key={course.id} accessibilityLabel={course.title} onPress={() => open(course.id)} style={{ width: Math.min(280, width - 72), gap: appSpacing.sm }}><LearningCourseCover course={course} compact /><Text numberOfLines={1} style={s.meta}>{course.authorDisplayName} · {course.questionCount} {zh ? '题' : 'questions'}</Text></AnimatedPressable>)}
      </ScrollView>
    </View> : null}
  </View>;
}
const useStyles = createLearningStyles(t => StyleSheet.create({
  sections: { gap: appSpacing.xxl }, section: { gap: appSpacing.md }, heading: { color: t.ink, fontFamily: type.displayExtraBold, fontSize: appTextStyles.screenTitle.fontSize, lineHeight: appTextStyles.screenTitle.lineHeight },
  feature: { gap: 10 }, meta: { color: t.inkSoft, fontFamily: type.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight }, rail: { gap: appSpacing.md, paddingBottom: appSpacing.xs },
}));
