import { appSpacing } from '@/theme/designSystem';
import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomBottomSheetModal from './CustomBottomSheetModal';

/** Controlled adapter over the app's gesture-aware sheet and independent backdrop. */
export function AppBottomSheet({ visible, onClose, children, height: requestedHeight }: { visible: boolean; onClose: () => void; children: ReactNode; height?: number }) {
  const sheet = useRef<BottomSheetModal>(null);
  const presented = useRef(false);
  const insets = useSafeAreaInsets(); const { height } = useWindowDimensions();
  useEffect(() => {
    if (visible) { presented.current = true; sheet.current?.present(); }
    else if (presented.current) { presented.current = false; sheet.current?.dismiss(); }
  }, [visible]);
  return <CustomBottomSheetModal ref={sheet} enableDynamicSizing={requestedHeight === undefined} snapPoints={requestedHeight === undefined ? undefined : [Math.min(height * 0.88, requestedHeight)]} maxDynamicContentSize={height * 0.88} topInset={insets.top + 12} onDismiss={() => { if (presented.current) { presented.current = false; onClose(); } }}>
    <BottomSheetView style={StyleSheet.flatten([styles.content, requestedHeight !== undefined && { flex: 1 }, { paddingBottom: Math.max(16, insets.bottom) }])}>{children}</BottomSheetView>
  </CustomBottomSheetModal>;
}
const styles = StyleSheet.create({ content: { paddingHorizontal: appSpacing.xl, paddingTop: appSpacing.sm, gap: appSpacing.md } });
