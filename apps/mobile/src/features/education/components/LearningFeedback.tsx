import { AppText as Text } from '@/components/ui/AppText';
import { appSpacing, appTextStyles } from '@/theme/designSystem';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { LearningArrival, useLearningCopy, useLearningStyles } from './LearningUi';
import { learningTypography as typography } from '../theme/learningTheme';

/** Feedback scrolls within the dock so long explanations never cover the CTA. */
export function LearningFeedback({ correct, title, explanation, correctAnswerText, sequence }: { correct: boolean; title: string; explanation?: string | null; correctAnswerText?: string | null; sequence: number }) {
  const { theme } = useLearningStyles();
  const { height } = useWindowDimensions();
  const ui = useLearningCopy();
  return <LearningArrival style={{ flexShrink: 1, minHeight: 0 }}>
    <ScrollView key={sequence} style={{ maxHeight: Math.max(80, height * .32), flexShrink: 1 }} contentContainerStyle={{ gap: appSpacing.sm, paddingBottom: 2 }} nestedScrollEnabled showsVerticalScrollIndicator>
    <Text accessibilityLiveRegion="polite" style={{ color: correct ? theme.successText : theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.prompt.fontSize, lineHeight: appTextStyles.prompt.lineHeight }}>{title}</Text>
    {explanation || correctAnswerText ? <View style={{ gap: 6 }}>
      {correctAnswerText ? <Text style={{ color: correct ? theme.successText : theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight }}>{ui.correctAnswer}: {correctAnswerText}</Text> : null}
      {explanation ? <Text style={{ color: correct ? theme.successText : theme.berryDeep, fontFamily: typography.bodyBold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight }}>{explanation}</Text> : null}
    </View> : null}
    </ScrollView>
  </LearningArrival>;
}
