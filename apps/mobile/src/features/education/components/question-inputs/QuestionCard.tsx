import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type QuestionCardProps = Readonly<{
  questionIndex: number;
  totalQuestions: number;
  children: ReactNode;
  errorText?: string;
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

export function QuestionCard({ questionIndex, totalQuestions, children, errorText }: QuestionCardProps) {
  const { styles } = useStyles();

  return (
    <View style={styles.card}>
      <Text
        accessibilityRole="header"
        accessibilityLabel={`${questionIndex + 1} of ${totalQuestions}`}
        style={styles.position}>
        {questionIndex + 1} / {totalQuestions}
      </Text>
      {children}
      {errorText ? <Text accessibilityRole="alert" style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}
