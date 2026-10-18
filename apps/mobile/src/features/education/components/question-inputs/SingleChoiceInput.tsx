import AnimatedPressable from '@/components/AnimatedPressable';
import type {
  EducationQuestionOption,
  SingleChoiceAnswer,
  SingleChoiceQuestion,
} from '@/features/education/types/question.types';
import { Text, View } from 'react-native';
import { useQuestionInputStyles } from './questionInputStyles';

export type SingleChoiceInputProps = Readonly<{
  question: SingleChoiceQuestion;
  value: SingleChoiceAnswer;
  onChange: (value: SingleChoiceAnswer) => void;
  disabled?: boolean;
}>;

export function SingleChoiceInput({
  question,
  value,
  onChange,
  disabled = false,
}: SingleChoiceInputProps) {
  const { styles } = useQuestionInputStyles();

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.prompt}>{question.prompt}</Text>
      <View style={styles.options} accessibilityRole="radiogroup">
        {question.options.map((option: EducationQuestionOption) => {
          const selected = value.optionId === option.id;
          return (
            <AnimatedPressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onChange({ type: 'single-choice', optionId: option.id })}
              style={[styles.option, selected && styles.optionSelected, disabled && styles.optionDisabled]}>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
              <Text style={styles.optionLabel}>{option.label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}
