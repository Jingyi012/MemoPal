import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { useLearningCopy, useLearningStyles } from './LearningUi';
import { learningTypography as typography } from '../theme/learningTheme';

export function LearningMemoryHero({ courseTitle, itemCount }: { courseTitle: string; itemCount: number | null }) {
  const ui = useLearningCopy();
  const { theme, styles } = useLearningStyles();
  const ink = theme.isDark ? theme.ink : '#4A2A00';
  return <LinearGradient colors={theme.math as [string, string]} start={[0, 0]} end={[1, 1]} style={{ borderRadius: 26, padding: 16, gap: 12, overflow: 'hidden' }}>
    <Text accessibilityElementsHidden style={{ position: 'absolute', right: 14, top: 10, fontSize: 52 }}>🧠</Text>
    <Text accessibilityRole="header" style={[styles.title, { color: ink, paddingRight: 64 }]}>{ui.memoryTitle}</Text>
    <Text style={[styles.small, { color: ink }]}>{courseTitle} · {itemCount ?? '…'} {ui.memoryItems}</Text>
  </LinearGradient>;
}

export function LearningMemoryItem({ prompt, answer, hint, index, method }: { prompt: string; answer: string; hint?: string | null; index: number; method: 'palace' | 'number-peg' }) {
  const { theme } = useLearningStyles();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 2, borderBottomWidth: 6, borderColor: theme.line, borderRadius: 20, backgroundColor: theme.paper }}>
    <LinearGradient colors={theme.math as [string, string]} style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Text style={{ fontSize: 28 }}>{method === 'palace' ? '🚪' : ['🕯️', '🦢', '👂', '⛵'][index % 4]}</Text></LinearGradient>
    <View style={{ flex: 1, minWidth: 0, gap: 3 }}><Text style={{ color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11, lineHeight: 16 }}>{prompt}</Text><Text style={{ color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, lineHeight: 21 }}>{answer}</Text>{hint ? <Text style={{ color: theme.violetDeep, fontFamily: typography.bodyBold, fontSize: 13, lineHeight: 20 }}>{hint}</Text> : null}</View>
  </View>;
}
