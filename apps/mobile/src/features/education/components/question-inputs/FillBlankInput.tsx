import type { FillBlankAnswer, FillBlankQuestion } from '@/features/education/types/question.types';
import { Keyboard, Platform, Text, TextInput, View } from 'react-native';
import { useQuestionInputStyles, useQuestionFeedback } from './questionInputStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { educationFillPromptParts } from '../../utils/educationFillWordBank';

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
  const feedback = useQuestionFeedback();

  if (question.wordBank?.length) {
    const parts = educationFillPromptParts(question.prompt);
    const color = feedback === true ? theme.successText : feedback === false ? theme.berryDeep : theme.violetDeep;
    return <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.prompt}>{parts.before}<Text style={{ color, textDecorationLine: 'underline' }}>{value.text ? ` ${value.text} ` : ' ＿＿＿ '}</Text>{parts.after}</Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
        {question.wordBank.map(option => {
          const selected = value.text === option.label;
          return <AnimatedPressable key={option.id} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: selected, disabled: disabled || selected }} disabled={disabled || selected} onPress={() => onChange({ type: 'fill-blank', text: option.label })} style={{ maxWidth: '100%', minHeight: 48, paddingHorizontal: 18, paddingVertical: 11, borderWidth: 2, borderBottomWidth: selected ? 2 : 6, borderColor: theme.line, borderRadius: 16, backgroundColor: selected ? theme.violetTint : theme.paper }}><Text style={[styles.optionLabel, { flex: 0, opacity: selected ? 0 : 1 }]}>{option.label}</Text></AnimatedPressable>;
        })}
      </View>
    </View>;
  }

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
        returnKeyType="done"
        onSubmitEditing={() => Keyboard.dismiss()}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholder}
        placeholderTextColor={theme.inkSoft}
        selectionColor={theme.violetDeep}
        style={[styles.input, { alignSelf: 'stretch', borderWidth: 0, borderBottomWidth: 4, borderRadius: 0, borderColor: feedback === true ? theme.successText : feedback === false ? theme.berryDeep : theme.violetDeep, color: feedback === true ? theme.successText : feedback === false ? theme.berryDeep : theme.violetDeep, backgroundColor: 'transparent', fontSize: 23, fontWeight: '800', textAlign: 'center', marginTop: 14 }]}
      />
    </View>
  );
}
