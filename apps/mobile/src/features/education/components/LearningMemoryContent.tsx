import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLearningCopy, useLearningStyles } from './LearningUi';
import { learningTypography as typography } from '../theme/learningTheme';

export function LearningMemoryHero({ courseTitle, itemCount }: { courseTitle: string; itemCount: number | null }) {
  const ui = useLearningCopy();
  const { theme, styles } = useLearningStyles();
  const ink = theme.ink;
  return <View style={{ backgroundColor: theme.violetTint, borderRadius: 26, padding: 16, gap: 12, overflow: 'hidden' }}>
    <Ionicons name="sparkles-outline" size={42} color={theme.violetDeep} style={{ position: 'absolute', right: 16, top: 16 }} />
    <Text accessibilityRole="header" style={[styles.title, { color: ink, paddingRight: 64 }]}>{ui.memoryTitle}</Text>
    <Text style={[styles.small, { color: ink }]}>{courseTitle} · {itemCount ?? '…'} {ui.memoryItems}</Text>
  </View>;
}

export function LearningMemoryItem({ prompt, answer, hint, index, method }: { prompt: string; answer: string; hint?: string | null; index: number; method: 'palace' | 'number-peg' }) {
  const { theme } = useLearningStyles();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 2, borderBottomWidth: 6, borderColor: theme.line, borderRadius: 20, backgroundColor: theme.paper }}>
    <View style={{ backgroundColor: theme.violetTint, width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><View style={{ alignItems: 'center', gap: 2 }}><Ionicons name={method === 'palace' ? 'business-outline' : 'grid-outline'} size={23} color={theme.violetDeep} /><Text style={{ color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 }}>{index + 1}</Text></View></View>
    <View style={{ flex: 1, minWidth: 0, gap: 3 }}><Text style={{ color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 14, lineHeight: 21 }}>{prompt}</Text><Text style={{ color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, lineHeight: 21 }}>{answer}</Text>{hint ? <Text style={{ color: theme.violetDeep, fontFamily: typography.bodyBold, fontSize: 13, lineHeight: 20 }}>{hint}</Text> : null}</View>
  </View>;
}
