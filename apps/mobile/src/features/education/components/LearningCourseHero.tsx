import { AppText as Text } from '@/components/ui/AppText';
import { appSpacing } from '@/theme/designSystem';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LearningProgress, SubjectArtwork, useLearningStyles, type LearningTheme } from './LearningUi';

/** Course identity shared by public courses and the owner's private learning path. */
export function LearningCourseHero({ title, subtitle, theme, caption, progress }: {
  title: string; subtitle: string; theme: LearningTheme; caption?: string;
  progress?: { value: number; total: number };
}) {
  const { styles: s, theme: palette } = useLearningStyles();
  return <LinearGradient colors={palette.hero as [string, string]} start={[0, 0]} end={[1, 1]} style={s.courseHero}>
    <View style={{ position: 'absolute', right: 12, top: 10 }}><SubjectArtwork theme={theme} size={60} /></View>
    <View style={{ paddingRight: 64, gap: appSpacing.sm }}>
      <Text numberOfLines={2} accessibilityRole="header" style={[s.title, { color: palette.heroInk }]}>{title}</Text>
      <Text style={[s.small, { color: palette.heroInk }]}>{subtitle}</Text>
    </View>
    {progress ? <LearningProgress value={progress.value} total={progress.total} color={palette.heroInk} /> : null}
    {caption ? <Text style={[s.small, { color: palette.heroInk }]}>{caption}</Text> : null}
  </LinearGradient>;
}
