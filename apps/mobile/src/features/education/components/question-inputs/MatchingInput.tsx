import type { EducationMatchingAnswerPair, MatchingAnswer, MatchingQuestion } from '@/features/education/types/question.types';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { typography } from '@/theme/typography';
import { useQuestionInputStyles } from './questionInputStyles';
import { assignEducationMatch } from '@/features/education/utils/assignEducationMatch';

export type MatchingInputProps = Readonly<{
  question: MatchingQuestion;
  value: MatchingAnswer;
  onChange: (value: MatchingAnswer) => void;
  labels: Readonly<{ hint: string; chooseMatch: string }>;
  disabled?: boolean;
}>;

export function MatchingInput({ question, value, onChange, labels, disabled = false }: MatchingInputProps) {
  const { styles: inputStyles, theme } = useQuestionInputStyles();
  const [activeLeftId, setActiveLeftId] = useState<string | null>(question.options[0]?.id ?? null);
  const matchByLeftId = new Map(value.matches.map(match => [match.leftOptionId, match.matchTargetId]));
  const targetById = new Map(question.matchTargets.map(target => [target.id, target]));

  const selectTarget = (targetId: string) => {
    if (disabled || !activeLeftId) return;
    const matches: EducationMatchingAnswerPair[] = assignEducationMatch(value.matches, activeLeftId, targetId);
    onChange({ type: 'matching', matches });
    const nextUnmatched = question.options.find(option => option.id !== activeLeftId && !matches.some(match => match.leftOptionId === option.id));
    setActiveLeftId(nextUnmatched?.id ?? activeLeftId);
  };

  return (
    <View style={inputStyles.container}>
      <Text style={inputStyles.hint}>{labels.hint}</Text>
      <View style={styles.columns}>
        <View style={styles.column}>
          {question.options.map((option, index) => {
            const selected = option.id === activeLeftId;
            const target = targetById.get(matchByLeftId.get(option.id) ?? '');
            return (
              <Pressable key={option.id} accessibilityRole="button"
                accessibilityLabel={`${option.label}${target ? `, ${target.label}` : ''}`}
                accessibilityState={{ selected, disabled }} disabled={disabled}
                onPress={() => setActiveLeftId(option.id)}
                style={({ pressed }) => [styles.leftRow, { backgroundColor: selected ? theme.violetTint : theme.paper,
                  borderColor: selected ? theme.violetDeep : theme.line, opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[inputStyles.optionLabel, styles.leftLabel]}>{`${index + 1}. ${option.label}`}</Text>
                <Text style={[styles.assigned, { color: target ? theme.successText : theme.inkMuted }]} numberOfLines={2}>
                  {target?.label ?? '—'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.column}>
          <Text style={[styles.columnHeading, { color: theme.inkSoft }]}>{labels.chooseMatch}</Text>
          {question.matchTargets.map(target => {
            const selected = activeLeftId !== null && matchByLeftId.get(activeLeftId) === target.id;
            return (
              <Pressable key={target.id} accessibilityRole="button" accessibilityLabel={target.label}
                accessibilityState={{ selected, disabled }} disabled={disabled}
                onPress={() => selectTarget(target.id)}
                style={({ pressed }) => [styles.targetRow, { backgroundColor: selected ? theme.mintTint : theme.paper,
                  borderColor: selected ? theme.successText : theme.line, opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[inputStyles.optionLabel, styles.targetLabel]}>{target.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', gap: 9 },
  column: { flex: 1, gap: 8 },
  columnHeading: { fontFamily: typography.bodyExtraBold, fontSize: 13, minHeight: 24, paddingHorizontal: 3 },
  leftRow: { borderRadius: 13, borderWidth: 1.5, gap: 3, justifyContent: 'center', minHeight: 60, paddingHorizontal: 9, paddingVertical: 7 },
  leftLabel: { fontSize: 14, lineHeight: 19 },
  assigned: { fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 14 },
  targetRow: { alignItems: 'center', borderRadius: 13, borderWidth: 1.5, justifyContent: 'center', minHeight: 60, paddingHorizontal: 9, paddingVertical: 7 },
  targetLabel: { fontSize: 14, lineHeight: 19 },
});
