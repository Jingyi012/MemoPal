import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type QuestionCardProps = Readonly<{
  questionIndex: number;
  totalQuestions: number;
  children: ReactNode;
  errorText?: string;
  variant?: 'default' | 'learning';
}>;

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    card: {
      alignSelf: 'stretch',
      backgroundColor: theme.paper,
      borderColor: theme.line,
      borderRadius: 20,
      borderWidth: 1,
      gap: 16,
      padding: 16,
    },
    learningCard: { alignSelf: 'stretch', gap: 16 },
    position: {
      color: theme.inkSoft,
      fontFamily: typography.bodyExtraBold,
      fontSize: 14,
    },
    error: {
      color: theme.berryDeep,
      fontFamily: typography.bodyBold,
      fontSize: 14,
      lineHeight: 20,
    },
  }),
);

export function QuestionCard({ questionIndex, totalQuestions, children, errorText, variant = 'default' }: QuestionCardProps) {
  const { styles } = useStyles();

  return (
    <View style={variant === 'learning' ? styles.learningCard : styles.card}>
      {variant === 'default' ? <Text
        accessibilityRole="header"
        accessibilityLabel={`${questionIndex + 1} of ${totalQuestions}`}
        style={styles.position}>
        {questionIndex + 1} / {totalQuestions}
      </Text> : null}
      {children}
      {errorText ? <Text accessibilityRole="alert" style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}
