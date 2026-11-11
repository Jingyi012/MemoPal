import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLearningCopy, useLearningStyles } from './LearningUi';
import { learningTypography as typography } from '../theme/learningTheme';

export function LearningMemoryHero({ courseTitle, itemCount }: { courseTitle: string; itemCount: number | null }) {
  const ui = useLearningCopy();
  const { theme, styles } = useLearningStyles();
  const ink = theme.ink;
  return <View style={{ backgroundColor: theme.violetTint, borderRadius: appRadii.hero, padding: appSpacing.lg, gap: appSpacing.md, overflow: 'hidden' }}>
    <Ionicons name="sparkles-outline" size={42} color={theme.violetDeep} style={{ position: 'absolute', right: 16, top: 16 }} />
    <Text accessibilityRole="header" style={[styles.title, { color: ink, paddingRight: 64 }]}>{ui.memoryTitle}</Text>
    <Text style={[styles.small, { color: ink }]}>{courseTitle} · {itemCount ?? '…'} {ui.memoryItems}</Text>
  </View>;
}

export function LearningMemoryItem({ prompt, answer, hint, index, method }: { prompt: string; answer: string; hint?: string | null; index: number; method: 'palace' | 'number-peg' }) {
  const { theme } = useLearningStyles();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: appSpacing.md, padding: appSpacing.md, borderWidth: 2, borderBottomWidth: 6, borderColor: theme.line, borderRadius: appRadii.card, backgroundColor: theme.paper }}>
    <View style={{ backgroundColor: theme.violetTint, width: 52, height: 52, borderRadius: appRadii.control, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><View style={{ alignItems: 'center', gap: 2 }}><Ionicons name={method === 'palace' ? 'business-outline' : 'grid-outline'} size={23} color={theme.violetDeep} /><Text style={{ color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize }}>{index + 1}</Text></View></View>
    <View style={{ flex: 1, minWidth: 0, gap: 3 }}><Text style={{ color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight }}>{prompt}</Text><Text style={{ color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight }}>{answer}</Text>{hint ? <Text style={{ color: theme.violetDeep, fontFamily: typography.bodyBold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight }}>{hint}</Text> : null}</View>
  </View>;
}
