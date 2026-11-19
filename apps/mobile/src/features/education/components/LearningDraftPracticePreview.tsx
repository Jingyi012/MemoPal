import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppText as Text } from '@/components/ui/AppText';
import { appLayout, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import type { StudyCourseAiOutput } from '../api/educationCourseDraft.api';
import type { DraftUnit } from '../utils/educationDraftEditor';
import { matchingCoursePairCells } from '../utils/invalidateCourseDraftQuestions';
import { createLearningStyles } from '../theme/learningTheme';
import { LearningIconButton } from './LearningIconButton';
import { useLearningCopy } from './LearningUi';

type PreviewQuestion = StudyCourseAiOutput['questions'][number];

export function LearningDraftPracticePreview({ output, units, includedIndexes, expandedUnitIds, onChange, onToggleUnit, renderStudyUnit, onPrepareAgain, prepared = true }: {
  output: StudyCourseAiOutput; units: DraftUnit[]; includedIndexes: number[]; expandedUnitIds: string[];
  renderStudyUnit?: (unit: DraftUnit, index: number) => ReactNode; onPrepareAgain?: () => void; prepared?: boolean;
  onChange: (indexes: number[]) => void; onToggleUnit: (id: string) => void;
}) {
  const { styles: s, theme } = useStyles();
  const { zh } = useLearningCopy();
  const [removed, setRemoved] = useState<{ index: number; units: DraftUnit[]; output: StudyCourseAiOutput } | null>(null);
  // An edit can invalidate an answer. Undo is available only for the unchanged preview.
  const canUndo = removed && removed.units === units && removed.output === output && !includedIndexes.includes(removed.index);
  return <View style={s.section}>
    <View style={s.row}>
      <Text style={[s.heading, s.flex]}>{renderStudyUnit ? (zh ? '单元内容' : 'Course units') : (zh ? '练习预览' : 'Practice preview')}</Text>
      {prepared ? <Text style={s.count}>{zh ? `已选 ${includedIndexes.length} 道` : `${includedIndexes.length} selected`}</Text> : null}
    </View>
    {onPrepareAgain ? <AnimatedPressable accessibilityRole="button" onPress={onPrepareAgain} style={s.prepareAction}>
      <Ionicons name="refresh-outline" size={18} color={theme.violetDeep} /><Text style={s.action}>{zh ? '重新准备练习' : 'Prepare practice again'}</Text>
      <Ionicons name="chevron-forward" size={16} color={theme.violetDeep} />
    </AnimatedPressable> : null}
    {canUndo ? <View accessibilityLiveRegion="polite" style={s.undoBar}>
      <Text style={[s.secondary, s.flex]}>{zh ? '已移除一道题' : 'Question removed'}</Text>
      <AnimatedPressable accessibilityRole="button" accessibilityLabel={zh ? '撤销移除题目' : 'Undo removing question'} style={s.textButton}
        onPress={() => { onChange([...includedIndexes, removed.index].sort((a, b) => a - b)); setRemoved(null); }}>
        <Text style={s.action}>{zh ? '撤销' : 'Undo'}</Text>
      </AnimatedPressable>
    </View> : null}
    {units.map((unit, unitIndex) => {
      const questions = output.questions.map((question, index) => ({ question, index })).filter(item => item.question.unitId === unit.id);
      if (!questions.length && !renderStudyUnit) return null;
      const selected = questions.filter(item => includedIndexes.includes(item.index));
      const expanded = expandedUnitIds.includes(unit.id);
      return <View key={unit.id} style={s.group}>
        <AnimatedPressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => onToggleUnit(unit.id)} style={s.unitHeader}>
          <View style={s.flex}>
            <Text style={s.unitTitle}>{unit.title || (zh ? `单元 ${unitIndex + 1}` : `Unit ${unitIndex + 1}`)}</Text>
            <Text style={s.secondary}>{zh ? `${selected.length} 道练习` : `${selected.length} questions`}</Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.inkSoft} />
        </AnimatedPressable>
        {expanded ? <>{renderStudyUnit?.(unit, unitIndex)}{selected.length ? <Text style={s.caption}>{zh ? '单元练习' : 'Unit practice'}</Text> : null}{selected.length ? selected.map(({ question, index }) => <QuestionCard key={index} question={question}
          number={questions.findIndex(item => item.index === index) + 1} onRemove={() => {
            setRemoved({ index, units, output }); onChange(includedIndexes.filter(value => value !== index));
          }} />) : <Text style={s.empty}>{prepared ? (zh ? '本单元未保留练习，学习卡片仍会保存。' : 'No questions selected. Your study cards will still be saved.') : (zh ? '保存时会根据已有说明准备基础练习；也可先点击重新准备，预览更多题型。' : 'Basic practice will be prepared from your notes when you save. Prepare again to preview more question types.')}</Text>}</> : null}
      </View>;
    })}
  </View>;
}

function QuestionCard({ question, number, onRemove }: { question: PreviewQuestion; number: number; onRemove: () => void }) {
  const { styles: s, theme } = useStyles();
  const { zh } = useLearningCopy();
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [answersOpen, setAnswersOpen] = useState(number === 1);
  const labels: Record<string, string> = zh
    ? { 'single-choice': '单选', 'fill-blank': '填空', matching: '配对', 'true-false': '判断', ordering: '排序' }
    : { 'single-choice': 'Multiple choice', 'fill-blank': 'Fill in', matching: 'Matching', 'true-false': 'True / false', ordering: 'Ordering' };
  const answer = question.type === 'true-false'
    ? question.correctBooleanAnswer ? (zh ? '正确' : 'True') : (zh ? '错误' : 'False')
    : question.answer;
  return <View style={s.card}>
    <View style={s.row}>
      <Text style={s.questionNumber}>{zh ? `第 ${number} 题` : `Question ${number}`}</Text>
      <Text style={[s.type, s.flex]}>{labels[question.type] ?? (zh ? '练习' : 'Practice')}</Text>
      <LearningIconButton icon="trash-outline" label={zh ? `移除第 ${number} 题` : `Remove question ${number}`} onPress={onRemove} />
    </View>
    <Text style={s.prompt}>{question.prompt}</Text>
    <AnimatedPressable accessibilityRole="button" accessibilityState={{ expanded: answersOpen }} onPress={() => setAnswersOpen(value => !value)} style={s.explanationToggle}>
      <Text style={s.action}>{zh ? answersOpen ? '收起答案' : '查看答案' : answersOpen ? 'Hide answer' : 'View answer'}</Text>
      <Ionicons name={answersOpen ? 'chevron-up' : 'chevron-down'} size={16} color={theme.violetDeep} />
    </AnimatedPressable>
    {answersOpen ? <>{question.type === 'single-choice' ? <View style={s.answers}>{question.options.map((option, index) => {
      const correct = index === question.correctOptionIndex;
      return <View key={index} style={[s.option, correct && s.correct]}>
        <Text style={[s.optionLetter, correct && s.correctText]}>{String.fromCharCode(65 + index)}</Text>
        <Text style={[s.body, s.flex]}>{option}</Text>
        {correct ? <Ionicons accessibilityLabel={zh ? '正确答案' : 'Correct answer'} name="checkmark-circle" size={20} color={theme.successText} /> : null}
      </View>;
    })}</View> : question.type === 'matching' ? <View style={s.answers}>
      <Text style={s.caption}>{zh ? '正确配对' : 'Correct pairs'}</Text>
      {(question.pairs ?? []).map(pair => {
        const [left, right] = matchingCoursePairCells(pair);
        return <View key={pair.entryId} style={s.pair}>
          <Text style={[s.body, s.flex]}>{left}</Text>
          <Ionicons name="arrow-forward" size={16} color={theme.inkMuted} />
          <Text style={[s.body, s.flex]}>{right}</Text>
        </View>;
      })}
    </View> : question.type === 'ordering' ? <View style={s.answers}>
      <Text style={s.caption}>{zh ? '正确顺序' : 'Correct order'}</Text>
      {(question.correctSequenceIds ?? []).map((id, index) => <View key={id} style={s.pair}>
        <Text style={s.sequenceNumber}>{index + 1}</Text>
        <Text style={[s.body, s.flex]}>{question.options[Number(id.split('-').at(-1)) - 1]}</Text>
      </View>)}
    </View> : <View style={s.answer}>
      <View style={s.row}><Ionicons name="checkmark-circle" size={18} color={theme.successText} /><Text style={s.correctText}>{zh ? '正确答案' : 'Correct answer'}</Text></View>
      <Text style={s.body}>{answer}</Text>
    </View>}
    {question.explanation ? <View style={s.explanation}>
      <AnimatedPressable accessibilityRole="button" accessibilityState={{ expanded: explanationOpen }} onPress={() => setExplanationOpen(value => !value)} style={s.explanationToggle}>
        <Text style={s.action}>{zh ? explanationOpen ? '收起解析' : '查看解析' : explanationOpen ? 'Hide explanation' : 'View explanation'}</Text>
        <Ionicons name={explanationOpen ? 'chevron-up' : 'chevron-down'} size={16} color={theme.violetDeep} />
      </AnimatedPressable>
      {explanationOpen ? <Text style={s.secondary}>{question.explanation}</Text> : null}
    </View> : null}</> : null}
  </View>;
}

const useStyles = createLearningStyles(t => StyleSheet.create({
  prepareAction: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: appSpacing.sm, minHeight: appLayout.touchTarget },
  section: { gap: appSpacing.md },
  group: { gap: appSpacing.md },
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: appSpacing.sm },
  heading: { ...appTextStyles.cardTitle, color: t.ink },
  count: { ...appTextStyles.labelStrong, color: t.violetDeep, backgroundColor: t.violetTint, borderRadius: appRadii.pill, paddingHorizontal: appSpacing.md, paddingVertical: appSpacing.xs },
  unitHeader: { flexDirection: 'row', alignItems: 'center', gap: appSpacing.md, minHeight: appLayout.touchTarget, paddingVertical: appSpacing.sm },
  unitTitle: { ...appTextStyles.bodyStrong, color: t.ink },
  card: { borderWidth: 1, borderColor: t.line, borderRadius: appRadii.card, backgroundColor: t.paper, padding: appSpacing.lg, gap: appSpacing.md },
  questionNumber: { ...appTextStyles.labelStrong, color: t.inkSoft },
  type: { ...appTextStyles.labelStrong, color: t.violetDeep },
  prompt: { ...appTextStyles.bodyStrong, color: t.ink },
  body: { ...appTextStyles.body, color: t.ink },
  secondary: { ...appTextStyles.small, color: t.inkSoft },
  caption: { ...appTextStyles.label, color: t.inkSoft },
  answers: { gap: appSpacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: appSpacing.sm, padding: appSpacing.md, borderWidth: 1, borderColor: t.line, borderRadius: appRadii.control },
  optionLetter: { ...appTextStyles.labelStrong, color: t.violetDeep, width: appSpacing.xl },
  correct: { borderColor: t.mintLine, backgroundColor: t.mintTint },
  correctText: { ...appTextStyles.labelStrong, color: t.successText },
  pair: { flexDirection: 'row', alignItems: 'center', gap: appSpacing.md, padding: appSpacing.md, backgroundColor: t.canvas, borderRadius: appRadii.small },
  sequenceNumber: { ...appTextStyles.labelStrong, color: t.violetDeep, minWidth: appSpacing.lg },
  answer: { backgroundColor: t.mintTint, borderRadius: appRadii.control, padding: appSpacing.md, gap: appSpacing.sm },
  explanation: { borderTopWidth: 1, borderTopColor: t.line, paddingTop: appSpacing.xs, gap: appSpacing.xs },
  explanationToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: appSpacing.sm, minHeight: appLayout.touchTarget },
  action: { ...appTextStyles.bodyStrong, color: t.violetDeep },
  undoBar: { flexDirection: 'row', alignItems: 'center', gap: appSpacing.sm, backgroundColor: t.violetTint, borderRadius: appRadii.control, paddingHorizontal: appSpacing.md },
  textButton: { minHeight: appLayout.touchTarget, minWidth: appLayout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  empty: { ...appTextStyles.small, color: t.inkSoft, paddingVertical: appSpacing.md },
}));
