import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing } from '@/theme/designSystem';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LearningButton, SubjectArtwork, learningThemeFor, useLearningCopy, useLearningStyles } from './LearningUi';
import type { EducationPublicCourseSummary } from '../types/educationPractice.types';

/** Real catalog content only: a first lesson must never be a fabricated local course. */
export function LearningFirstLessonCard({ course, onPress }: {
  course: Pick<EducationPublicCourseSummary, 'title' | 'isMemoPalStarter' | 'subjectCode'>;
  onPress: () => void;
}) {
  const { styles: s, theme } = useLearningStyles();
  const { zh } = useLearningCopy();
  return <LinearGradient colors={theme.hero as [string, string]} start={[0, 0]} end={[1, 1]}
    style={{ borderRadius: appRadii.hero, padding: appSpacing.xl, gap: appSpacing.lg, overflow: 'hidden' }}>
    <View style={{ gap: appSpacing.sm }}>
      <Text style={[s.small, { color: theme.heroInk }]}>{course.isMemoPalStarter
        ? (zh ? '✦ MemoPal 体验课' : '✦ MemoPal starter lesson')
        : (zh ? '✦ 发现一节新课' : '✦ Discover a new lesson')}</Text>
      <View style={[s.row, { alignItems: 'flex-start' }]}>
        <View style={{ flex: 1, gap: appSpacing.sm }}>
          <Text accessibilityRole="header" style={[s.title, { color: theme.heroInk }]}>{zh ? '你的学习冒险，从这里开始' : 'Your learning adventure starts here'}</Text>
          <Text style={[s.body, { color: theme.heroInk }]}>{course.title}</Text>
        </View>
        <SubjectArtwork theme={learningThemeFor(course.title, theme, course.subjectCode)} size={64} />
      </View>
    </View>
    <View style={[s.row, { flexWrap: 'wrap', gap: appSpacing.md }]}>
      {[
        ['book-outline', zh ? '学一点' : 'Discover'],
        ['game-controller-outline', zh ? '练几题' : 'Try it'],
        ['star-outline', zh ? '看见进步' : 'Grow'],
      ].map(([icon, label]) => <View key={icon} style={[s.row, { gap: 5 }]}>
        <Ionicons name={icon as 'book-outline'} size={17} color={theme.heroInk} />
        <Text style={[s.small, { color: theme.heroInk }]}>{label}</Text>
      </View>)}
    </View>
    <LearningButton tone="white" label={zh ? '探索第一节课' : 'Explore your first lesson'} onPress={onPress} />
  </LinearGradient>;
}
