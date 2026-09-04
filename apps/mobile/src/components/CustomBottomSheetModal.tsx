import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProps,
  useBottomSheetTimingConfigs,
} from '@gorhom/bottom-sheet';
import React, { forwardRef, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { BackHandler, Platform, StyleSheet } from 'react-native';

interface Props extends Partial<BottomSheetModalProps> {
  children?: ReactNode;
  snapPoints?: string[] | number[];
}

type Ref = BottomSheetModal;

const CustomBottomSheetModal = forwardRef<Ref, Props>(
  ({ children, snapPoints, enableDynamicSizing, onChange, onDismiss, ...restProps }, ref) => {
    const defaultSnapPoints = useMemo(() => ['75%', '95%'], []);
    const usedSnapPoints = snapPoints ?? (enableDynamicSizing === true ? undefined : defaultSnapPoints);
    const animationConfigs = useBottomSheetTimingConfigs({ duration: 180 });
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const isPresentedRef = useRef(false);

    useEffect(() => {
      if (Platform.OS !== 'android') return undefined;

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!isPresentedRef.current || !bottomSheetRef.current) return false;
        bottomSheetRef.current.dismiss();
        return true;
      });

      return () => subscription.remove();
    }, []);

    const assignRef = useCallback((instance: BottomSheetModal | null) => {
      bottomSheetRef.current = instance;
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref) {
        ref.current = instance;
      }
    }, [ref]);

    const renderBackdrop = useCallback(
      (backdropProps: any) => (
        <BottomSheetBackdrop
          {...backdropProps}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.38}
          pressBehavior="close"
        />
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={assignRef}
        snapPoints={usedSnapPoints}
        enableDynamicSizing={enableDynamicSizing}
        onChange={(index, position, type) => {
          isPresentedRef.current = index >= 0;
          onChange?.(index, position, type);
        }}
        onDismiss={() => {
          isPresentedRef.current = false;
          onDismiss?.();
        }}
        backdropComponent={renderBackdrop}
        animationConfigs={animationConfigs}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handleIndicator}
        enablePanDownToClose
        {...restProps}>
        {children}
      </BottomSheetModal>
    );
  }
);

CustomBottomSheetModal.displayName = 'CustomBottomSheetModal';

export default CustomBottomSheetModal;

const styles = StyleSheet.create({
  background: { backgroundColor: '#FFFDF8' },
  handleIndicator: { backgroundColor: '#D8D4C9', width: 42 },
});
