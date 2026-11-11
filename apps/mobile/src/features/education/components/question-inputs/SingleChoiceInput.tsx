import { AppText as Text } from '@/components/ui/AppText';
import { appSpacing } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { LearningReadAloud } from '../LearningReadAloud';
import type {
  EducationQuestionOption,
  SingleChoiceAnswer,
  SingleChoiceQuestion,
} from '@/features/education/types/question.types';
import { View } from 'react-native';
import { useCorrectAnswer, useQuestionInputStyles, useQuestionFeedback } from './questionInputStyles';

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
  const { styles, theme } = useQuestionInputStyles();
  const feedback = useQuestionFeedback();
  const correctAnswer = useCorrectAnswer();

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: appSpacing.md }}>
        <Text accessibilityRole="header" style={[styles.prompt, { flex: 1 }]}>{question.prompt}</Text>
        <LearningReadAloud key={question.id} text={question.prompt} language={/[\u3400-\u9fff]/u.test(question.prompt) ? 'zh-Hans' : 'en'} />
      </View>
      <View style={styles.options} accessibilityRole="radiogroup">
        {question.options.map((option: EducationQuestionOption, index) => {
          const selected = value.optionId === option.id;
          const correct = correctAnswer?.type === 'single-choice' ? correctAnswer.optionId === option.id : selected && feedback === true;
          const incorrect = selected && (correctAnswer ? !correct : feedback === false);
          const markerColor = correct ? theme.successText : incorrect ? theme.berryDeep : theme.violetDeep;
          return (
            <AnimatedPressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onChange({ type: 'single-choice', optionId: option.id })}
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
