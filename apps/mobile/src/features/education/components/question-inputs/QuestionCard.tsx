import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

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
      borderRadius: appRadii.card,
      borderWidth: 1,
      gap: appSpacing.lg,
      padding: appSpacing.lg,
    },
    learningCard: { alignSelf: 'stretch', gap: appSpacing.lg },
    position: {
      color: theme.inkSoft,
      fontFamily: typography.bodyExtraBold,
      fontSize: appTextStyles.label.fontSize,
    },
    error: {
      color: theme.berryDeep,
      fontFamily: typography.bodyBold,
      fontSize: appTextStyles.label.fontSize,
      lineHeight: appTextStyles.label.lineHeight,
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
