import type { MatchingAnswer, MatchingQuestion } from '@/features/education/types/question.types';
import { useState } from 'react';
import AnimatedPressable from '@/components/AnimatedPressable';
import { StyleSheet, Text, View, useWindowDimensions, type LayoutRectangle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useLearningCopy } from '../LearningUi';
import { useCorrectAnswer, useQuestionFeedback, useQuestionInputStyles } from './questionInputStyles';
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
  const { zh } = useLearningCopy();
  const feedback = useQuestionFeedback();
  const correctAnswer = useCorrectAnswer();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width / fontScale < 300;
  const [activeLeftId, setActiveLeftId] = useState<string | null>(null);
  const [layouts, setLayouts] = useState<Record<string, LayoutRectangle>>({});
  const measure = (key: string, next: LayoutRectangle) => setLayouts(current => {
    const old = current[key];
    return old && ['x', 'y', 'width', 'height'].every(field => Math.abs(old[field as keyof LayoutRectangle] - next[field as keyof LayoutRectangle]) < .5) ? current : { ...current, [key]: next };
  });
  const matchByLeftId = new Map(value.matches.map(match => [match.leftOptionId, match.matchTargetId]));
  const targetById = new Map(question.matchTargets.map(target => [target.id, target]));
  const paired = question.options.filter(option => targetById.has(matchByLeftId.get(option.id) ?? '')).length;
  const active = question.options.find(option => option.id === activeLeftId);
  const pairColors = [
    { stroke: theme.violetDeep, tint: theme.violetTint },
    { stroke: theme.isDark ? '#FFBC74' : '#C15B00', tint: theme.isDark ? '#493421' : '#FFF1DF' },
    { stroke: theme.isDark ? '#71DCE8' : '#00849A', tint: theme.isDark ? '#203F48' : '#E3F5F7' },
  ];
  const appearance = (index: number) => {
    const option = question.options[index];
    const targetId = matchByLeftId.get(option.id);
    if (feedback !== null && targetId) {
      const correct = feedback || (correctAnswer?.type === 'matching' && correctAnswer.matches?.some(pair => pair.leftOptionId === option.id && pair.matchTargetId === targetId));
      return { stroke: correct ? theme.successText : theme.berryDeep, tint: correct ? theme.mintTint : theme.berryTint };
    }
    return pairColors[index % pairColors.length];
  };
  const selectTarget = (targetId: string) => {
    if (disabled || !activeLeftId) return;
    const matches = assignEducationMatch(value.matches, activeLeftId, targetId);
    onChange({ type: 'matching', matches });
    const next = question.options.find(option => !matches.some(match => match.leftOptionId === option.id));
    setActiveLeftId(next?.id ?? null);
  };
  const instruction = feedback !== null ? (zh ? '已完成' : 'Completed')
    : active ? (zh ? `现在为 ${active.label} 选一个对应项` : `Choose a match for ${active.label}`)
      : paired === question.options.length ? (zh ? '点击任一配对可以重新连接' : 'Tap a pair to reconnect')
        : (zh ? '先点左边的词，再点右边的意思' : 'Tap a word, then its meaning');

  return <View style={inputStyles.container}>
    <Text accessibilityRole="header" style={inputStyles.prompt}>{question.prompt}</Text>
    <View style={styles.statusRow}>
      <Text accessibilityLiveRegion="polite" style={[inputStyles.hint, { flex: 1 }]}>{instruction}</Text>
      <View style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: feedback === true ? theme.mintTint : theme.violetTint }}><Text style={[inputStyles.hint, { color: feedback === true ? theme.successText : theme.violetDeep }]}>{zh ? '已配对' : 'Paired'} {paired}/{question.options.length}</Text></View>
    </View>
    <View style={[styles.columns, stacked && { flexDirection: 'column', gap: 16 }]} onLayout={event => measure('board', event.nativeEvent.layout)}>
      {!stacked && layouts.board ? <Svg pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill} width={layouts.board.width} height={layouts.board.height}>
        {question.options.map((option, index) => {
          const left = layouts[`left:${option.id}`];
          const right = layouts[`right:${matchByLeftId.get(option.id) ?? ''}`];
          const column = layouts.rightColumn;
          if (!left || !right || !column) return null;
          const x1 = left.x + left.width;
          const x2 = column.x + right.x;
          const y1 = left.y + left.height / 2;
          const y2 = right.y + right.height / 2;
          const mid = (x1 + x2) / 2;
          const color = appearance(index).stroke;
          return <MatchConnection key={option.id} x1={x1} y1={y1} x2={x2} y2={y2} mid={mid} color={color} />;
        })}
      </Svg> : null}
      <View style={styles.column}>
        {question.options.map((option, index) => {
          const selected = option.id === activeLeftId && !disabled;
          const target = targetById.get(matchByLeftId.get(option.id) ?? '');
          const color = appearance(index);
          const emphasized = !!target || selected;
          return <View key={option.id} onLayout={event => measure(`left:${option.id}`, event.nativeEvent.layout)}><AnimatedPressable accessibilityRole="button"
            accessibilityLabel={`${index + 1}. ${option.label}${target ? `, ${target.label}` : ''}`} accessibilityState={{ selected, disabled }} disabled={disabled}
            onPress={() => setActiveLeftId(option.id)}
            style={[styles.card, { backgroundColor: emphasized ? color.tint : theme.paper, borderColor: emphasized ? color.stroke : theme.line, borderStyle: selected ? 'dashed' : 'solid' }]}>
            <Text style={[inputStyles.optionLabel, styles.word]}>{stacked ? `${index + 1}. ` : ''}{option.label}</Text>
          </AnimatedPressable></View>;
        })}
      </View>
      <View style={styles.column} accessibilityLabel={labels.chooseMatch} onLayout={event => measure('rightColumn', event.nativeEvent.layout)}>
        {question.matchTargets.map(target => {
          const owner = question.options.findIndex(option => matchByLeftId.get(option.id) === target.id);
          const selected = activeLeftId !== null && matchByLeftId.get(activeLeftId) === target.id;
          const color = owner >= 0 ? appearance(owner) : null;
          return <View key={target.id} onLayout={event => measure(`right:${target.id}`, event.nativeEvent.layout)}><AnimatedPressable accessibilityRole="button" accessibilityLabel={`${owner >= 0 ? `${owner + 1}. ` : ''}${target.label}`}
            accessibilityState={{ selected, disabled }} disabled={disabled} onPress={() => selectTarget(target.id)}
            style={[styles.card, { backgroundColor: color?.tint ?? theme.paper, borderColor: color?.stroke ?? theme.line }]}>
            <Text style={[inputStyles.optionLabel, styles.meaning]}>{stacked && owner >= 0 ? `${owner + 1}. ` : ''}{target.label}</Text>
          </AnimatedPressable></View>;
        })}
      </View>
    </View>
  </View>;
}

function MatchConnection({ x1, y1, x2, y2, mid, color }: { x1: number; y1: number; x2: number; y2: number; mid: number; color: string }) {
  return <>
    <Path d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`} stroke={color} strokeWidth={2.5} fill="none" />
    <Circle cx={x1} cy={y1} r={3.5} fill={color} /><Circle cx={x2} cy={y2} r={3.5} fill={color} />
  </>;
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  columns: { flexDirection: 'row', gap: 38, position: 'relative' },
  column: { flex: 1, minWidth: 0, gap: 12 },
  card: { borderRadius: 18, borderWidth: 1.5, borderBottomWidth: 4, justifyContent: 'center', minHeight: 82, paddingHorizontal: 10, paddingVertical: 14 },
  word: { flex: 0, flexShrink: 1, fontSize: 16, lineHeight: 22, textAlign: 'center' },
  meaning: { flex: 0, flexShrink: 1, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
