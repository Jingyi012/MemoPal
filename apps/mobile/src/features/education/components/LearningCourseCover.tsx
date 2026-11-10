import { StyleSheet, Text, View } from 'react-native';
import { createLearningStyles, learningTypography as type } from '../theme/learningTheme';
import { SubjectArtwork, learningThemeFor, useLearningCopy } from './LearningUi';
import type { EducationPublicCourseSummary } from '../types/educationPractice.types';

/** Authored titles and existing subject artwork; no downloaded cover assets. */
export function LearningCourseCover({ course, compact = false }: { course: EducationPublicCourseSummary; compact?: boolean }) {
  const { styles: s, theme } = useStyles(); const ui = useLearningCopy();
  const subject = learningThemeFor(course.title, theme, course.subjectCode);
  const tint = subject.key === 'science' ? theme.mintTint : subject.key === 'math' ? theme.pairOrangeTint : subject.key === 'english' ? theme.skyTint : theme.violetTint;
  const ink = subject.key === 'science' ? theme.successText : subject.key === 'math' ? theme.subjectMathInk : subject.key === 'english' ? theme.link : theme.violetDeep;
  const label = subject.key === 'other' ? (ui.zh ? '课程' : 'Course') : ui[subject.key];
  return <View style={[s.cover, compact && s.compact]}>
    <View pointerEvents="none" style={[s.orbit, { borderColor: ink }]} />
    <View style={s.copy}><Text style={[s.label, { color: ink }]}>{label}</Text><Text numberOfLines={compact ? 3 : 4} style={[s.title, compact && s.compactTitle]}>{course.title}</Text></View>
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.art}><SubjectArtwork theme={{ ...subject, color: ink, tint, line: ink }} size={compact ? 56 : 76} /></View>
  </View>;
}
const useStyles = createLearningStyles(t => StyleSheet.create({
  cover: { backgroundColor: t.paper, borderWidth: 1, borderColor: t.line, minHeight: 164, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 8, overflow: 'hidden' },
  compact: { minHeight: 142, padding: 14, borderRadius: 18 },
  copy: { flex: 1, minWidth: 0, gap: 10, zIndex: 1 },
  label: { fontFamily: type.bodyExtraBold, fontSize: 12 },
  title: { color: t.ink, fontFamily: type.displayExtraBold, fontWeight: '800', fontSize: 23, lineHeight: 30 },
  compactTitle: { fontSize: 17, lineHeight: 24 }, art: { alignSelf: 'flex-end', paddingBottom: 8 },
  orbit: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1, opacity: 0.14, right: -40, top: -48 },
}));
