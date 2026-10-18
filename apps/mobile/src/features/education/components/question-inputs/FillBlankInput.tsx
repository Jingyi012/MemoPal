import type { FillBlankAnswer, FillBlankQuestion } from '@/features/education/types/question.types';
import { Platform, Text, TextInput, View } from 'react-native';
import { useQuestionInputStyles } from './questionInputStyles';

export type FillBlankInputProps = Readonly<{
  question: FillBlankQuestion;
  value: FillBlankAnswer;
  onChange: (value: FillBlankAnswer) => void;
  placeholder: string;
  disabled?: boolean;
}>;

export function FillBlankInput({
  question,
  value,
  onChange,
  placeholder,
  disabled = false,
}: FillBlankInputProps) {
  const { styles, theme } = useQuestionInputStyles();

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.prompt}>{question.prompt}</Text>
      <TextInput
        accessibilityLabel={question.prompt}
        editable={!disabled}
        keyboardType={question.fillMode === 'number'
          ? Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'decimal-pad'
          : 'default'}
        value={value.text}
        onChangeText={(text) => onChange({ type: 'fill-blank', text })}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholder}
        placeholderTextColor={theme.inkSoft}
        selectionColor={theme.violetDeep}
        style={[styles.input, disabled && styles.optionDisabled]}
      />
    </View>
  );
}
