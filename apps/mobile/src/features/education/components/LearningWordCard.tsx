import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AnimatedPressable from '@/components/AnimatedPressable';
import { createLearningStyles, learningTypography as typography } from '../theme/learningTheme';
import { LearningReadAloud } from './LearningReadAloud';
import { useLearningCopy } from './LearningUi';

export function LearningWordCard({ primary, secondary, phonetic, extra, language }: {
  primary: string; secondary?: string | null; phonetic?: string | null; extra?: string | null; language?: string | null;
}) {
  const { styles: s, theme } = useStyles();
  const { zh } = useLearningCopy();
  const [revealed, setRevealed] = useState(false);
  const meaning = secondary?.trim() && secondary.trim() !== primary.trim() ? secondary : null;
  const note = extra?.trim() && extra.trim() !== primary.trim() && extra.trim() !== meaning?.trim() ? extra : null;
  const wordStyle = primary.length <= 12 ? s.word : primary.length <= 28 ? s.phrase : s.longPhrase;
  const content = <>
    <Text accessibilityRole="header" style={wordStyle}>{primary}</Text>
    {phonetic ? <Text style={s.phonetic}>{phonetic}</Text> : null}
    {meaning && revealed ? <View style={s.meaning}><Text style={s.meaningText}>{meaning}</Text></View> : null}
    {meaning ? <View style={s.revealLabel}><Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={16} color={theme.violetDeep} /><Text style={s.hint}>{revealed ? (zh ? '收起释义' : 'Hide meaning') : (zh ? '轻点查看释义' : 'Tap to see the meaning')}</Text></View> : null}
  </>;
  return <View style={s.card}>
    <View style={s.topRow}>
      <View style={s.label}><Ionicons name="albums-outline" size={17} color={theme.violetDeep} /><Text style={s.labelText}>{zh ? '学习卡片' : 'STUDY CARD'}</Text></View>
      {language ? <LearningReadAloud text={primary} language={language} /> : null}
    </View>
    {meaning ? <AnimatedPressable accessibilityRole="button" accessibilityLabel={`${primary}${phonetic ? ` ${phonetic}` : ''}${revealed ? ` · ${meaning}` : ''} · ${zh ? (revealed ? '收起释义' : '查看释义') : (revealed ? 'Hide meaning' : 'Show meaning')}`}
      accessibilityState={{ expanded: revealed }} onPress={() => setRevealed(value => !value)} style={s.wordArea}>{content}</AnimatedPressable>
      : <View style={s.wordArea}>{content}</View>}
    {note ? <View style={s.note}><Text style={s.noteText}>{note}</Text></View> : null}
    <View style={s.bottomRow}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.soundBars}>{[10, 18, 26, 18, 10].map((height, index) => <View key={index} style={[s.bar, { height }]} />)}</View>
      <Text style={s.hint}>{language ? (zh ? '先听一听，再读一遍' : 'Listen, then say it aloud') : (zh ? '看一看，再读一遍' : 'Look, then say it aloud')}</Text>
    </View>
  </View>;
}

const useStyles = createLearningStyles(t => StyleSheet.create({
  card: { flexGrow: 1, minHeight: 300, borderWidth: 2, borderBottomWidth: 6, borderColor: t.line, backgroundColor: t.paper, borderRadius: 28, padding: 20, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.violetTint, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, flexShrink: 1 },
  labelText: { color: t.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12, flexShrink: 1 },
  wordArea: { flexGrow: 1, minHeight: 150, justifyContent: 'center', alignItems: 'center', gap: 12, paddingVertical: 20 },
  word: { color: t.ink, fontFamily: typography.displayExtraBold, fontSize: 42, lineHeight: 54, textAlign: 'center' },
  phrase: { color: t.ink, fontFamily: typography.displayExtraBold, fontSize: 34, lineHeight: 44, textAlign: 'center' },
  longPhrase: { color: t.ink, fontFamily: typography.displayExtraBold, fontSize: 26, lineHeight: 36, textAlign: 'center' },
  phonetic: { color: t.inkSoft, fontFamily: typography.bodySemibold, fontSize: 18, lineHeight: 26, textAlign: 'center' },
  meaning: { borderTopWidth: 1, borderTopColor: t.line, paddingTop: 16, width: '100%' },
  meaningText: { color: t.ink, fontFamily: typography.bodyBold, fontSize: 19, lineHeight: 28, textAlign: 'center' },
  revealLabel: { flexDirection: 'row', gap: 6, alignItems: 'center', minHeight: 44 },
  hint: { color: t.violetDeep, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 18, flexShrink: 1 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.line },
  soundBars: { height: 28, flexDirection: 'row', gap: 3, alignItems: 'center' },
  bar: { width: 4, borderRadius: 4, backgroundColor: t.violetDeep },
  note: { backgroundColor: t.violetTint, borderRadius: 16, padding: 12 },
  noteText: { color: t.ink, fontFamily: typography.bodySemibold, fontSize: 14, lineHeight: 22 },
}));
