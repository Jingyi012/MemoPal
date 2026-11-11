import { AppText as Text } from '@/components/ui/AppText';
import AnimatedPressable from '@/components/AnimatedPressable';
import type { EducationQuestionOption, MultipleSelectAnswer, MultipleSelectQuestion } from '@/features/education/types/question.types';
import { View } from 'react-native';
import { useCorrectAnswer, useQuestionHints, useQuestionInputStyles, useQuestionFeedback } from './questionInputStyles';

export type MultipleSelectInputProps = Readonly<{
  question: MultipleSelectQuestion;
  value: MultipleSelectAnswer;
  onChange: (value: MultipleSelectAnswer) => void;
  hint: string;
  disabled?: boolean;
}>;

export function MultipleSelectInput({ question, value, onChange, hint, disabled = false }: MultipleSelectInputProps) {
  const { styles, theme } = useQuestionInputStyles();
  const showHints = useQuestionHints();
  const feedback = useQuestionFeedback();
  const correctAnswer = useCorrectAnswer();
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.prompt}>{question.prompt}</Text>
      {showHints ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.options}>
        {question.options.map((option: EducationQuestionOption, index) => {
          const selected = value.optionIds.includes(option.id);
          const correct = correctAnswer?.type === 'multiple-select' ? !!correctAnswer.optionIds?.includes(option.id) : selected && feedback === true;
          const incorrect = selected && correctAnswer?.type === 'multiple-select' && !correct;
          const markerColor = correct ? theme.successText : incorrect ? theme.berryDeep : theme.violetDeep;
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
              style={[styles.option, selected && styles.optionSelected, correct && styles.optionCorrect, incorrect && styles.optionIncorrect]}>
              <View style={[styles.marker, (selected || correct || incorrect) && { backgroundColor: markerColor, borderColor: markerColor }]}><Text style={[styles.markerText, (selected || correct || incorrect) && { color: theme.onAccent }]}>{String.fromCharCode(65 + index)}</Text></View>
              <Text style={styles.optionLabel}>{option.label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}
