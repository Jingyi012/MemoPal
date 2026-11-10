import { Text, View, StyleSheet } from 'react-native';
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
const useStyles = createThemedStyles(t => StyleSheet.create({ title: { color: t.ink, fontFamily: typography.displayExtraBold, fontWeight: '800', fontSize: 19, lineHeight: 26 }, list: { gap: 4 }, row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 }, label: { color: t.ink, fontFamily: typography.bodyBold, fontSize: 15, lineHeight: 22, flex: 1 } }));
