import { Text, TextInput, View } from 'react-native';
import { useQuestionInputStyles } from './questionInputStyles';
import type { WrittenResponseAnswer, WrittenResponseQuestion } from '../../types/question.types';

export function WrittenResponseInput({ question, value, onChange, hint, placeholder, disabled = false }: {
  question: WrittenResponseQuestion;
  value: WrittenResponseAnswer;
  onChange: (value: WrittenResponseAnswer) => void;
  hint: string;
  placeholder: string;
  disabled?: boolean;
}) {
  const { styles, theme } = useQuestionInputStyles();
  return <View style={styles.container}>
    <Text style={styles.hint}>{hint}</Text>
    <TextInput
      accessibilityLabel={question.prompt}
      accessibilityHint={hint}
      editable={!disabled}
      multiline
      maxLength={12000}
      onChangeText={text => onChange({ type: 'written-response', text })}
      placeholder={placeholder}
      placeholderTextColor={theme.inkSoft}
      style={[styles.input, { minHeight: 150, lineHeight: 23, textAlignVertical: 'top' }, disabled && styles.optionDisabled]}
      textAlignVertical="top"
      value={value.text}
    />
    <Text accessibilityLiveRegion="polite" style={{ alignSelf: 'flex-end', color: theme.inkSoft, fontSize: 11 }}>{value.text.length} / 12000</Text>
  </View>;
}
