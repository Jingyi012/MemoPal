import AnimatedPressable from '@/components/AnimatedPressable';
import type { TrueFalseAnswer, TrueFalseQuestion } from '@/features/education/types/question.types';
import { Text, View } from 'react-native';
import { useQuestionInputStyles } from './questionInputStyles';

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
  const { styles } = useQuestionInputStyles();
  const choices = [
    { value: true, label: labels.trueLabel },
    { value: false, label: labels.falseLabel },
  ] as const;

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.prompt}>{question.prompt}</Text>
      <View style={styles.options} accessibilityRole="radiogroup">
        {choices.map((choice) => {
          const selected = value.value === choice.value;
          return (
            <AnimatedPressable
              key={choice.label}
              accessibilityRole="radio"
              accessibilityLabel={choice.label}
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onChange({ type: 'true-false', value: choice.value })}
              style={[styles.option, selected && styles.optionSelected, disabled && styles.optionDisabled]}>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
              <Text style={styles.optionLabel}>{choice.label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}
