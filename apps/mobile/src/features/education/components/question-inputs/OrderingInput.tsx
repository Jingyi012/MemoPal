import type { OrderingAnswer, OrderingQuestion } from '@/features/education/types/question.types';
import { useQuestionInputStyles } from './questionInputStyles';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { typography } from '@/theme/typography';
import { reorderEducationOptionIds } from '@/features/education/utils/reorderEducationOptionIds';

export type OrderingInputProps = Readonly<{
  question: OrderingQuestion;
  value: OrderingAnswer;
  onChange: (value: OrderingAnswer) => void;
  labels: Readonly<{ hint: string; moveUp: string; moveDown: string }>;
  disabled?: boolean;
}>;

export function OrderingInput({ question, value, onChange, labels, disabled = false }: OrderingInputProps) {
  const { styles: inputStyles, theme } = useQuestionInputStyles();
  const items = value.orderedOptionIds.length > 0
    ? value.orderedOptionIds.map(id => question.options.find(option => option.id === id)).filter((item): item is (typeof question.options)[number] => Boolean(item))
    : question.options;

  const move = (index: number, offset: -1 | 1) => {
    if (disabled) return;
    const ids = items.map(item => item.id);
    onChange({ type: 'ordering', orderedOptionIds: reorderEducationOptionIds(ids, index, offset) });
  };

  return (
    <View style={inputStyles.container}>
      <Text style={inputStyles.hint}>{labels.hint}</Text>
      {items.map((item, index) => (
        <View key={item.id} style={styles.row}>
          <Text style={[inputStyles.optionLabel, styles.position]}>{index + 1}.</Text>
          <Text style={[inputStyles.optionLabel, styles.label]}>{item.label}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`${labels.moveUp}: ${item.label}`}
            accessibilityState={{ disabled: disabled || index === 0 }} disabled={disabled || index === 0}
            onPress={() => move(index, -1)} style={({ pressed }) => [styles.control, { borderColor: theme.line, backgroundColor: theme.paper, opacity: pressed ? 0.65 : 1 }]}>
            <Text style={[styles.controlText, { color: theme.link }]}>↑</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`${labels.moveDown}: ${item.label}`}
            accessibilityState={{ disabled: disabled || index === items.length - 1 }} disabled={disabled || index === items.length - 1}
            onPress={() => move(index, 1)} style={({ pressed }) => [styles.control, { borderColor: theme.line, backgroundColor: theme.paper, opacity: pressed ? 0.65 : 1 }]}>
            <Text style={[styles.controlText, { color: theme.link }]}>↓</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 8, minHeight: 56 },
  position: { flexGrow: 0, width: 26 },
  label: { flex: 1 },
  control: { alignItems: 'center', borderRadius: 12, borderWidth: 1.5, height: 48, justifyContent: 'center', width: 48 },
  controlText: { fontFamily: typography.bodyExtraBold, fontSize: 22, lineHeight: 26 },
});
