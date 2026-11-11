import { AppText as Text } from '@/components/ui/AppText';
import { AppTextInput as TextInput } from '@/components/ui/AppTextInput';
import { appTextStyles } from '@/theme/designSystem';
import { View } from 'react-native';
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
      style={[styles.input, { minHeight: 150, lineHeight: appTextStyles.body.lineHeight, textAlignVertical: 'top' }, disabled && styles.optionDisabled]}
      textAlignVertical="top"
      value={value.text}
    />
    <Text accessibilityLiveRegion="polite" style={{ alignSelf: 'flex-end', color: theme.inkSoft, fontSize: appTextStyles.small.fontSize }}>{value.text.length} / 12000</Text>
  </View>;
}
