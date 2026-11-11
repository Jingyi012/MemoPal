import { appSpacing } from '@/theme/designSystem';
import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createThemedStyles } from '@/theme/createThemedStyles';

/** In normal flow, so long content never hides behind the primary action. */
export function ScreenActionDock({ children }: { children: ReactNode }) {
  const { styles } = useStyles(); const insets = useSafeAreaInsets();
  return <View style={[styles.dock, { paddingBottom: Math.max(16, insets.bottom) }]}>{children}</View>;
}
const useStyles = createThemedStyles(t => StyleSheet.create({ dock: { paddingHorizontal: appSpacing.lg, paddingTop: appSpacing.md, backgroundColor: t.paper, borderTopWidth: 1, borderTopColor: t.line } }));
