import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { StyleSheet } from 'react-native';
import { createLearningStyles, learningTypography as type } from '../theme/learningTheme';

export const useDraftStyles = createLearningStyles(t => StyleSheet.create({
  content: { paddingHorizontal: appSpacing.lg, paddingTop: appSpacing.sm, paddingBottom: appSpacing.xxl, gap: 14 },
  card: { backgroundColor: t.paper, borderRadius: appRadii.card, borderColor: t.line, borderWidth: 1, padding: 14, gap: appSpacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: appSpacing.sm },
  title: { color: t.ink, fontFamily: type.displayExtraBold, fontSize: appTextStyles.prompt.fontSize, lineHeight: appTextStyles.prompt.lineHeight },
  heading: { color: t.ink, fontFamily: type.bodyExtraBold, fontSize: appTextStyles.cardTitle.fontSize, lineHeight: appTextStyles.cardTitle.lineHeight },
  body: { color: t.ink, fontFamily: type.bodyBold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight },
  small: { color: t.inkSoft, fontFamily: type.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  input: { minHeight: 48, borderRadius: appRadii.control, borderWidth: 1.5, borderColor: t.violetLine, backgroundColor: t.paper, color: t.ink, paddingHorizontal: appSpacing.md, paddingVertical: 10, fontFamily: type.bodySemibold, fontSize: appTextStyles.body.fontSize },
  chip: { minHeight: 44, borderRadius: appRadii.control, backgroundColor: t.violetTint, borderWidth: 1, borderColor: t.line, paddingHorizontal: appSpacing.md, paddingVertical: 10, justifyContent: 'center', maxWidth: '100%' },
  selectedChip: { backgroundColor: t.violetDeep, borderColor: t.violetDeep },
  chipText: { color: t.violetDeep, fontFamily: type.bodyExtraBold, fontSize: appTextStyles.small.fontSize, flexShrink: 1 },
  selectedText: { color: t.onAccent },
  badge: { color: t.violetDeep, backgroundColor: t.violetTint, borderRadius: 10, overflow: 'hidden', paddingHorizontal: appSpacing.sm, paddingVertical: 5, fontFamily: type.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  dashed: { minHeight: 48, borderRadius: appRadii.control, borderColor: t.violetDeep, borderStyle: 'dashed', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', padding: 10 },
  error: { color: t.berryDeep, fontFamily: type.bodyBold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  note: { backgroundColor: t.violetTint, borderRadius: appRadii.control, padding: appSpacing.md, gap: appSpacing.xs },
}));
