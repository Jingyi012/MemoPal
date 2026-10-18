import AnimatedPressable from '@/components/AnimatedPressable';
import type { EducationQuestionOption, MultipleSelectAnswer, MultipleSelectQuestion } from '@/features/education/types/question.types';
import { Text, View } from 'react-native';
import { useQuestionInputStyles } from './questionInputStyles';

export type MultipleSelectInputProps = Readonly<{
  question: MultipleSelectQuestion;
  value: MultipleSelectAnswer;
  onChange: (value: MultipleSelectAnswer) => void;
  hint: string;
  disabled?: boolean;
}>;

export function MultipleSelectInput({ question, value, onChange, hint, disabled = false }: MultipleSelectInputProps) {
  const { styles } = useQuestionInputStyles();
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.prompt}>{question.prompt}</Text>
      <Text style={styles.hint}>{hint}</Text>
      <View style={styles.options}>
        {question.options.map((option: EducationQuestionOption) => {
          const selected = value.optionIds.includes(option.id);
          return (
            <AnimatedPressable
              key={option.id}
              accessibilityRole="checkbox"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onChange({
                type: 'multiple-select',
                optionIds: selected ? value.optionIds.filter((id) => id !== option.id) : [...value.optionIds, option.id],
              })}
              style={[styles.option, selected && styles.optionSelected, disabled && styles.optionDisabled]}>
              <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                {selected ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>
              <Text style={styles.optionLabel}>{option.label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}
