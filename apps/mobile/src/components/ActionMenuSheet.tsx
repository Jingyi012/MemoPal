import { AppText as Text } from '@/components/ui/AppText';
import { appSpacing, appTextStyles } from '@/theme/designSystem';
import { View, StyleSheet } from 'react-native';
import type { LucideIcon } from '@/core/icons';
import { AppBottomSheet } from './AppBottomSheet';
import AnimatedPressable from './AnimatedPressable';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';

type MenuAction = { label: string; icon: LucideIcon; onPress: () => void; disabled?: boolean; destructive?: boolean };
export function ActionMenuSheet({ visible, title, onClose, actions }: { visible: boolean; title: string; onClose: () => void; actions: readonly MenuAction[] }) {
  const { styles: s, theme } = useStyles();
  return <AppBottomSheet visible={visible} onClose={onClose}><Text numberOfLines={2} style={s.title}>{title}</Text><View style={s.list}>
    {actions.map(({ icon: Icon, ...action }) => <AnimatedPressable key={action.label} accessibilityRole="button" disabled={action.disabled} accessibilityState={{ disabled: action.disabled }} onPress={() => { onClose(); action.onPress(); }} style={[s.row, action.disabled && { opacity: 0.45 }]}><Icon size={22} color={action.destructive ? theme.berryDeep : theme.violetDeep} /><Text style={[s.label, action.destructive && { color: theme.berryDeep }]}>{action.label}</Text></AnimatedPressable>)}
  </View></AppBottomSheet>;
}
const useStyles = createThemedStyles(t => StyleSheet.create({ title: { color: t.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.screenTitle.fontSize, lineHeight: appTextStyles.screenTitle.lineHeight }, list: { gap: appSpacing.xs }, row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: appSpacing.md }, label: { color: t.ink, fontFamily: typography.bodyBold, fontSize: appTextStyles.body.fontSize, lineHeight: appTextStyles.body.lineHeight, flex: 1 } }));
