import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createLearningStyles } from '../theme/learningTheme';
import { useLearningCopy } from './LearningUi';

export function LearningDraftPreviewSummary({ title, unitCount, cardCount, questionCount, charged, needsReview, withoutPractice = 0 }: {
  title: string; unitCount: number; cardCount: number; questionCount?: number; charged?: number; needsReview: number; withoutPractice?: number;
}) {
  const { styles: s, theme } = useStyles(); const { zh } = useLearningCopy();
  return <View style={s.card}>
    <View style={s.row}><Ionicons name="lock-closed-outline" size={14} color={theme.inkSoft} /><Text style={s.secondary}>{zh ? '私人学习内容' : 'Private study content'}</Text></View>
    <Text style={s.title}>{title}</Text>
    <View style={s.stats}>{[
      { value: unitCount, label: zh ? '单元' : 'Units' },
      { value: cardCount, label: zh ? '学习卡片' : 'Cards' },
      { value: questionCount ?? (zh ? '自动' : 'Auto'), label: zh ? '练习题' : 'Questions' },
    ].map(stat => <View key={stat.label} style={s.stat}><Text style={s.value}>{stat.value}</Text><Text style={s.secondary}>{stat.label}</Text></View>)}</View>
    <View style={s.footer}>
      <Ionicons name={needsReview ? 'alert-circle-outline' : 'checkmark-circle-outline'} size={18} color={needsReview ? theme.berryDeep : theme.successText} />
      <Text style={[s.secondary, s.flex]}>{needsReview ? (zh ? `${needsReview} 条意思待确认` : `${needsReview} meanings to review`) : withoutPractice > 0 ? (zh ? `${withoutPractice} 条未安排练习` : `${withoutPractice} entries without practice`) : (zh ? '内容已准备好' : 'Content ready')}</Text>
      {charged !== undefined ? <Text style={s.secondary}>{zh ? `已用 ${charged} credits` : `${charged} credits used`}</Text> : null}
    </View>
  </View>;
}

const useStyles = createLearningStyles(t => StyleSheet.create({
  card: { backgroundColor: t.paper, borderWidth: 1, borderColor: t.line, borderRadius: appRadii.card, padding: appSpacing.lg, gap: appSpacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: appSpacing.xs },
  flex: { flex: 1, minWidth: 0 },
  title: { ...appTextStyles.screenTitle, color: t.ink },
  secondary: { ...appTextStyles.label, color: t.inkSoft, flexShrink: 1 },
  stats: { flexDirection: 'row', gap: appSpacing.sm, paddingVertical: appSpacing.sm },
  stat: { flex: 1, gap: appSpacing.xs },
  value: { ...appTextStyles.cardTitle, color: t.violetDeep },
  footer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: appSpacing.sm, borderTopWidth: 1, borderTopColor: t.line, paddingTop: appSpacing.md },
}));
