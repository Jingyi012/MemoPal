import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AnimatedPressable from '@/components/AnimatedPressable';
import { createLearningStyles, learningTypography as typography } from '../theme/learningTheme';
import { useEducationGuidedCourseProgress } from '../hooks/useEducationPracticeItems';
import type { EducationPublicCourseSummary } from '../types/educationPractice.types';
import { courseAudienceLabels } from '../utils/educationCourseAudience';
import { LearningProgress, SubjectArtwork, learningThemeFor, useLearningCopy } from './LearningUi';

export function LearningCatalogCourseCard({ course, onPress }: { course: EducationPublicCourseSummary; onPress: () => void }) {
  const { styles: s, theme: palette } = useCatalogCardStyles();
  const ui = useLearningCopy();
  const progress = useEducationGuidedCourseProgress(course.id);
  const subject = learningThemeFor(course.title, palette, course.subjectCode);
  const artwork = subject.key === 'math' ? { ...subject, tint: palette.pairOrangeTint, line: palette.isDark ? palette.violetLine : palette.peachLine, color: palette.subjectMathInk }
    : subject.key === 'science' ? { ...subject, tint: palette.mintTint, line: palette.mintLine, color: palette.successText } : subject;
  const lessons = progress.data?.lessons;
  const solved = lessons?.reduce((count, lesson) => count + lesson.questionsSolved, 0) ?? 0;
  const total = lessons?.reduce((count, lesson) => count + lesson.questionCount, 0) ?? course.questionCount;
  const completed = !!lessons?.length && lessons.every(lesson => lesson.isComplete);
  const started = lessons?.some(lesson => lesson.isStarted);
  const status = completed ? ui.done : started ? ui.underway : ui.notStarted;
  const action = completed ? (ui.zh ? '再次练习' : 'Practise again') : started ? ui.continue : (ui.zh ? '探索课程' : 'Explore course');
  const subjectLabel = subject.key === 'other' ? (ui.zh ? '课程' : 'Course') : ui[subject.key];
  return <AnimatedPressable accessibilityRole="button" accessibilityLabel={`${course.title} · ${action}`} lively onPress={onPress} style={s.card}>
    <View style={[s.cover, { backgroundColor: artwork.tint }]}>
      <SubjectArtwork theme={artwork} size={52} />
      <View style={s.coverCopy}>
        <Text style={[s.subject, { color: artwork.color }]}>{subjectLabel}</Text>
        <Text numberOfLines={1} style={s.author}>{course.authorDisplayName}</Text>
      </View>
      {course.isSaved ? <Ionicons accessibilityLabel={ui.zh ? '已收藏' : 'Saved'} name="bookmark" size={20} color={artwork.color} /> : null}
    </View>
    <View style={s.body}>
      <Text numberOfLines={3} style={s.title}>{course.title}</Text>
      {courseAudienceLabels(course, ui.zh).length ? <Text style={s.meta}>{courseAudienceLabels(course, ui.zh).join(' · ')}</Text> : null}
      <View style={s.details}>
        <View style={s.detail}><Ionicons name="layers-outline" size={14} color={palette.inkSoft} /><Text style={s.meta}>{course.assessmentCount} {ui.zh ? '个练习' : 'practices'}</Text></View>
        <View style={s.detail}><Ionicons name="help-circle-outline" size={14} color={palette.inkSoft} /><Text style={s.meta}>{course.questionCount} {ui.zh ? '题' : 'questions'}</Text></View>
      </View>
      <View style={s.footer}>
        <View style={s.progress}>
          {progress.isLoading ? <Text style={s.meta}>{ui.zh ? '正在读取进度…' : 'Loading progress…'}</Text>
            : progress.isError ? <Text style={s.meta}>{ui.zh ? '进入课程查看进度' : 'Open to check progress'}</Text>
              : <>
                <View style={s.progressLabels}><Text style={[s.meta, completed && s.complete]}>{completed ? `✓ ${status}` : status}</Text><Text style={s.meta}>{solved}/{total}</Text></View>
                <LearningProgress value={solved} total={total} color={completed ? palette.successText : palette.violetDeep} height={7} />
              </>}
        </View>
        <View style={s.action}><Text style={s.actionText}>{action}</Text><Ionicons name="arrow-forward" size={17} color={palette.violetDeep} /></View>
      </View>
    </View>
  </AnimatedPressable>;
}

const useCatalogCardStyles = createLearningStyles(t => StyleSheet.create({
  card: { backgroundColor: t.paper, borderColor: t.line, borderWidth: 1.5, borderBottomWidth: 5, borderRadius: 23 },
  cover: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopLeftRadius: 21, borderTopRightRadius: 21 },
  coverCopy: { flex: 1, minWidth: 0, gap: 4 },
  subject: { fontFamily: typography.bodyExtraBold, fontSize: 14, lineHeight: 20 },
  author: { fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, color: t.inkSoft },
  body: { padding: 16, gap: 9 },
  title: { fontFamily: typography.displayExtraBold, fontSize: 19, lineHeight: 26, color: t.ink },
  meta: { fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, color: t.inkSoft },
  details: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footer: { borderTopWidth: 1, borderTopColor: t.line, paddingTop: 12, marginTop: 3, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  progress: { flexGrow: 1, flexBasis: 110, gap: 7 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  complete: { color: t.successText },
  action: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 13, paddingHorizontal: 12, backgroundColor: t.violetTint },
  actionText: { color: t.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12, lineHeight: 18 },
}));
