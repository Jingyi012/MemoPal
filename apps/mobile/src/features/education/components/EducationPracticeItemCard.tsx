import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appTextStyles } from '@/theme/designSystem';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { StyleSheet } from 'react-native';

type EducationPracticeItemCardProps = Readonly<{
  title: string;
  questionCount: string;
  formatSummary: string;
  onPress: () => void;
}>;

export function EducationPracticeItemCard({ title, questionCount, formatSummary, onPress }: EducationPracticeItemCardProps) {
  const { styles } = useStyles();
  return (
    <AnimatedPressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{questionCount} · {formatSummary}</Text>
    </AnimatedPressable>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.card, borderWidth: 2, borderBottomWidth: 6, gap: 5, minHeight: 76, padding: 14 },
  title: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.body.fontSize },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
}));
