import type { OrderingAnswer, OrderingQuestion } from '@/features/education/types/question.types';
import { useQuestionHints, useQuestionInputStyles } from './questionInputStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { learningTypography as typography } from '@/features/education/theme/learningTheme';
import { reorderEducationOptionIds } from '@/features/education/utils/reorderEducationOptionIds';
import { addEducationOrderingOption, removeEducationOrderingOption } from '@/features/education/utils/educationOrderingBuilder';

export type OrderingInputProps = Readonly<{
  question: OrderingQuestion;
  value: OrderingAnswer;
  onChange: (value: OrderingAnswer) => void;
  labels: Readonly<{ hint: string; moveUp: string; moveDown: string; yourOrder: string; wordBank: (remaining: number) => string; removeWord: string; addWord: string }>;
  buildFromWordBank?: boolean;
  disabled?: boolean;
}>;

export function OrderingInput({ question, value, onChange, labels, buildFromWordBank = false, disabled = false }: OrderingInputProps) {
  const { styles: inputStyles, theme } = useQuestionInputStyles();
  const showHints = useQuestionHints();
  const selectedItems = value.orderedOptionIds.map(id => question.options.find(option => option.id === id)).filter((item): item is (typeof question.options)[number] => Boolean(item));
  const items = buildFromWordBank ? selectedItems : selectedItems.length > 0 ? selectedItems : question.options;
  const selectedIds = new Set(items.map(item => item.id));
  const wordBank = buildFromWordBank ? question.options.filter(item => !selectedIds.has(item.id)) : [];

  const move = (index: number, offset: -1 | 1) => {
    if (disabled) return;
    const ids = items.map(item => item.id);
    onChange({ type: 'ordering', orderedOptionIds: reorderEducationOptionIds(ids, index, offset) });
  };

  const append = (id: string) => {
    if (disabled) return;
    onChange({ type: 'ordering', orderedOptionIds: addEducationOrderingOption(value.orderedOptionIds, id, question.options.map(item => item.id)) });
  };

  const remove = (id: string) => {
    if (disabled) return;
    onChange({ type: 'ordering', orderedOptionIds: removeEducationOrderingOption(value.orderedOptionIds, id) });
  };

  if (buildFromWordBank) return <View style={inputStyles.container}>
    <Text accessibilityRole="header" style={inputStyles.prompt}>{question.prompt}</Text>
    {showHints ? <Text style={inputStyles.hint}>{labels.hint}</Text> : null}
    <View accessibilityLabel={labels.yourOrder} style={{ minHeight: 104, borderTopWidth: 2, borderBottomWidth: 2, borderColor: theme.line, paddingVertical: 12, gap: 8 }}>
      <Text style={inputStyles.hint}>{labels.yourOrder}</Text>
      {items.map((item, index) => <AnimatedPressable key={item.id} accessibilityLabel={`${labels.removeWord}: ${item.label}, ${index + 1}`} disabled={disabled} onPress={() => remove(item.id)} style={{ minHeight: 48, borderRadius: 16, borderWidth: 2, borderBottomWidth: 6, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 16, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }}><Text style={[inputStyles.optionLabel, { flex: 0, color: theme.violetDeep }]}>{index + 1}</Text><Text style={[inputStyles.optionLabel, { flexShrink: 1 }]}>{item.label}</Text><Ionicons name="close-circle-outline" size={20} color={theme.violetDeep} /></AnimatedPressable>)}
    </View>
    <View accessibilityLabel={labels.wordBank(wordBank.length)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
      {question.options.map(item => {
        const used = selectedIds.has(item.id);
        return <AnimatedPressable key={item.id} accessibilityLabel={`${labels.addWord}: ${item.label}`} accessibilityState={{ disabled: disabled || used }} disabled={disabled || used} onPress={() => append(item.id)} style={{ maxWidth: '100%', minHeight: 48, borderRadius: 16, borderWidth: 2, borderBottomWidth: used ? 2 : 6, borderColor: theme.line, backgroundColor: used ? theme.violetTint : theme.paper, paddingVertical: 11, paddingHorizontal: 18 }}><Text style={[inputStyles.optionLabel, { flex: 0, flexShrink: 1, color: used ? theme.inkSoft : theme.ink }]}>{used ? '✓ ' : ''}{item.label}</Text></AnimatedPressable>;
      })}
    </View>
  </View>;

  return <View style={inputStyles.container}>
    <Text accessibilityRole="header" style={inputStyles.prompt}>{question.prompt}</Text>
    {showHints ? <Text style={inputStyles.hint}>{labels.hint}</Text> : null}
    {items.map((item,index)=><View key={item.id} style={[styles.row, { borderColor: theme.line, backgroundColor: theme.paper }]}>
      <Text style={[inputStyles.optionLabel, { flex: 0, color: theme.violetDeep }]}>{index+1}</Text>
      <Text style={[inputStyles.optionLabel, { flex: 1 }]}>{item.label}</Text>
      {([-1,1] as const).map(offset=><AnimatedPressable key={offset} accessibilityLabel={`${offset === -1 ? labels.moveUp : labels.moveDown}: ${item.label}`} disabled={disabled || index+offset<0 || index+offset>=items.length} onPress={()=>move(index,offset)} style={styles.control}><Text style={[styles.controlText, {color:theme.violetDeep}]}>{offset===-1?'↑':'↓'}</Text></AnimatedPressable>)}
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 8, borderRadius: 16, borderWidth: 2, borderBottomWidth: 6, padding: 12 },
  control: { alignItems: 'center', borderRadius: 12, height: 44, justifyContent: 'center', width: 44 },
  controlText: { fontFamily: typography.bodyExtraBold, fontSize: 22, lineHeight: 26 },
});
