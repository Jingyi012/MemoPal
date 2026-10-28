import AnimatedPressable from '@/components/AnimatedPressable';
import type { TrueFalseAnswer, TrueFalseQuestion } from '@/features/education/types/question.types';
import { Text, View } from 'react-native';
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
  const correctAnswer = useCorrectAnswer();
  const choices = [
    { value: true, label: labels.trueLabel },
    { value: false, label: labels.falseLabel },
  ] as const;

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.prompt}>{question.prompt}</Text>
      <View style={[styles.options, { flexDirection: 'row' }]} accessibilityRole="radiogroup">
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
              style={[styles.option, { flex: 1, minHeight: 120, flexDirection: 'column', justifyContent: 'center' }, selected && styles.optionSelected, correct && styles.optionCorrect, incorrect && styles.optionIncorrect]}>
              <View accessibilityElementsHidden style={[styles.marker, (selected || correct || incorrect) && { backgroundColor: markerColor, borderColor: markerColor }]}><Text style={{ fontSize: 20, color: selected || correct || incorrect ? theme.onAccent : theme.violetDeep }}>{choice.value ? '✓' : '×'}</Text></View>
              <Text style={[styles.optionLabel, { flex: 0, fontSize: 20, lineHeight: 26, textAlign: 'center' }]}>{choice.label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}
