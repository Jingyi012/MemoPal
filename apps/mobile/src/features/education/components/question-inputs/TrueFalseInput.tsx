import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import type { TrueFalseAnswer, TrueFalseQuestion } from '@/features/education/types/question.types';
import { View, useWindowDimensions } from 'react-native';
import { useCorrectAnswer, useQuestionInputStyles, useQuestionFeedback } from './questionInputStyles';

export type TrueFalseInputProps = Readonly<{
  question: TrueFalseQuestion;
  value: TrueFalseAnswer;
  onChange: (value: TrueFalseAnswer) => void;
  labels: Readonly<{ trueLabel: string; falseLabel: string }>;
  disabled?: boolean;
}>;

export function TrueFalseInput({
  question,
  value,
  onChange,
  labels,
  disabled = false,
}: TrueFalseInputProps) {
  const { styles, theme } = useQuestionInputStyles();
  const feedback = useQuestionFeedback();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width / fontScale < 300;
  const correctAnswer = useCorrectAnswer();
  const choices = [
    { value: true, label: labels.trueLabel },
    { value: false, label: labels.falseLabel },
  ] as const;

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.prompt}>{question.prompt}</Text>
      <View style={[styles.options, { flexDirection: stacked ? 'column' : 'row' }]} accessibilityRole="radiogroup">
        {choices.map((choice) => {
          const selected = value.value === choice.value;
          const correct = correctAnswer?.type === 'true-false' ? correctAnswer.booleanValue === choice.value : selected && feedback === true;
          const incorrect = selected && (correctAnswer ? !correct : feedback === false);
          const markerColor = correct ? theme.successText : incorrect ? theme.berryDeep : theme.violetDeep;
          return (
            <AnimatedPressable
              key={choice.label}
              accessibilityRole="radio"
              accessibilityLabel={choice.label}
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onChange({ type: 'true-false', value: choice.value })}
              style={[styles.option, { flex: stacked ? undefined : 1, minHeight: stacked ? 88 : 120, flexDirection: 'column', justifyContent: 'center' }, selected && styles.optionSelected, correct && styles.optionCorrect, incorrect && styles.optionIncorrect]}>
              <View accessibilityElementsHidden style={[styles.marker, (selected || correct || incorrect) && { backgroundColor: markerColor, borderColor: markerColor }]}><Text style={{ fontSize: appTextStyles.screenTitle.fontSize, color: selected || correct || incorrect ? theme.onAccent : theme.violetDeep }}>{choice.value ? '✓' : '×'}</Text></View>
              <Text style={[styles.optionLabel, { flex: 0, fontSize: appTextStyles.screenTitle.fontSize, lineHeight: appTextStyles.screenTitle.lineHeight, textAlign: 'center' }]}>{choice.label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}
