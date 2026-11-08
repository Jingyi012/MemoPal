import { StyleSheet } from 'react-native';
import { createLearningStyles, learningTypography as type } from '../theme/learningTheme';

export const useDraftStyles = createLearningStyles(t => StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 14 },
  card: { backgroundColor: t.paper, borderRadius: 20, borderColor: t.line, borderWidth: 1.5, borderBottomWidth: 4, padding: 14, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: t.ink, fontFamily: type.displayExtraBold, fontSize: 21, lineHeight: 28 },
  heading: { color: t.ink, fontFamily: type.bodyExtraBold, fontSize: 16, lineHeight: 23 },
  body: { color: t.ink, fontFamily: type.bodyBold, fontSize: 14, lineHeight: 21 },
  small: { color: t.inkSoft, fontFamily: type.bodySemibold, fontSize: 12, lineHeight: 18 },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1.5, borderColor: t.violetLine, backgroundColor: t.paper, color: t.ink, paddingHorizontal: 12, paddingVertical: 10, fontFamily: type.bodySemibold, fontSize: 15 },
  chip: { minHeight: 44, borderRadius: 12, backgroundColor: t.violetTint, borderWidth: 1, borderColor: t.line, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center', maxWidth: '100%' },
  selectedChip: { backgroundColor: t.violetDeep, borderColor: t.violetDeep },
  chipText: { color: t.violetDeep, fontFamily: type.bodyExtraBold, fontSize: 13, flexShrink: 1 },
  selectedText: { color: t.onAccent },
  badge: { color: t.violetDeep, backgroundColor: t.violetTint, borderRadius: 10, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, fontFamily: type.bodyExtraBold, fontSize: 12 },
  dashed: { minHeight: 48, borderRadius: 15, borderColor: t.violetDeep, borderStyle: 'dashed', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', padding: 10 },
  error: { color: t.berryDeep, fontFamily: type.bodyBold, fontSize: 13, lineHeight: 20 },
  note: { backgroundColor: t.violetTint, borderRadius: 16, padding: 12, gap: 4 },
}));
