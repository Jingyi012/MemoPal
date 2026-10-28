import type { EducationMatchingAnswerPair, MatchingAnswer, MatchingQuestion } from '@/features/education/types/question.types';
import { useState } from 'react';
import AnimatedPressable from '@/components/AnimatedPressable';
import { StyleSheet, Text, View } from 'react-native';
import { learningTypography as typography } from '@/features/education/theme/learningTheme';
import { useQuestionHints, useQuestionInputStyles } from './questionInputStyles';
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
  const showHints = useQuestionHints();
  const [activeLeftId, setActiveLeftId] = useState<string | null>(question.options[0]?.id ?? null);
  const matchByLeftId = new Map(value.matches.map(match => [match.leftOptionId, match.matchTargetId]));
  const targetById = new Map(question.matchTargets.map(target => [target.id, target]));
  const pairColors = [theme.violetDeep, theme.isDark ? theme.sun : '#B85C19', theme.isDark ? theme.sky : '#197D7D'];

  const selectTarget = (targetId: string) => {
    if (disabled || !activeLeftId) return;
    const matches: EducationMatchingAnswerPair[] = assignEducationMatch(value.matches, activeLeftId, targetId);
    onChange({ type: 'matching', matches });
    const nextUnmatched = question.options.find(option => option.id !== activeLeftId && !matches.some(match => match.leftOptionId === option.id));
    setActiveLeftId(nextUnmatched?.id ?? activeLeftId);
  };

  return (
    <View style={inputStyles.container}>
      <Text accessibilityRole="header" style={inputStyles.prompt}>{question.prompt}</Text>
      {showHints ? <Text style={inputStyles.hint}>{labels.hint}</Text> : null}
      <View style={styles.columns}>
        <View style={styles.column}>
          {question.options.map((option, index) => {
            const selected = option.id === activeLeftId;
            const target = targetById.get(matchByLeftId.get(option.id) ?? '');
            return (
              <AnimatedPressable key={option.id} accessibilityRole="button"
                accessibilityLabel={`${option.label}${target ? `, ${target.label}` : ''}`}
                accessibilityState={{ selected, disabled }} disabled={disabled}
                onPress={() => setActiveLeftId(option.id)}
                style={[styles.leftRow, { backgroundColor: selected && !disabled ? theme.violetTint : theme.paper,
                  borderColor: target ? pairColors[index % pairColors.length] : selected ? theme.violetDeep : theme.line }]}>
                <Text style={[inputStyles.optionLabel, styles.leftLabel]}>{option.label}</Text>
              </AnimatedPressable>
            );
          })}
        </View>
        <View style={styles.column} accessibilityLabel={labels.chooseMatch}>
          {question.matchTargets.map(target => {
            const selected = activeLeftId !== null && matchByLeftId.get(activeLeftId) === target.id;
            const owner = question.options.findIndex(option => matchByLeftId.get(option.id) === target.id);
            return (
              <AnimatedPressable key={target.id} accessibilityRole="button" accessibilityLabel={target.label}
                accessibilityState={{ selected, disabled }} disabled={disabled}
                onPress={() => selectTarget(target.id)}
                style={[styles.targetRow, { backgroundColor: selected ? theme.violetTint : theme.paper,
                  borderColor: owner >= 0 ? pairColors[owner % pairColors.length] : theme.line }]}>
                <Text style={[inputStyles.optionLabel, styles.targetLabel]}>{target.label}</Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', gap: 12 },
  column: { flex: 1, minWidth: 0, gap: 12 },
  columnHeading: { fontFamily: typography.bodyExtraBold, fontSize: 13, minHeight: 24, paddingHorizontal: 3 },
  leftRow: { borderRadius: 16, borderWidth: 3, borderBottomWidth: 6, justifyContent: 'center', minHeight: 64, paddingHorizontal: 8, paddingVertical: 16 },
  leftLabel: { flex: 0, flexShrink: 1, fontSize: 16, lineHeight: 22, textAlign: 'center' },
  assigned: { fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 14 },
  targetRow: { alignItems: 'stretch', borderRadius: 16, borderWidth: 3, borderBottomWidth: 6, justifyContent: 'center', minHeight: 64, paddingHorizontal: 8, paddingVertical: 16 },
  targetLabel: { alignSelf: 'stretch', flex: 0, flexShrink: 1, fontSize: 16, lineHeight: 22, textAlign: 'center' },
});
