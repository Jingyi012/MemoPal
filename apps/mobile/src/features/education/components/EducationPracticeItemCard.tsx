import AnimatedPressable from '@/components/AnimatedPressable';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { StyleSheet, Text } from 'react-native';

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
  card: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 16, borderWidth: 1.5, gap: 5, minHeight: 76, padding: 14 },
  title: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 18 },
}));
