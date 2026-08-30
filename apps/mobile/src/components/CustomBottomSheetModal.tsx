import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProps,
  useBottomSheetTimingConfigs,
} from '@gorhom/bottom-sheet';
import React, { forwardRef, ReactNode, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';

interface Props extends Partial<BottomSheetModalProps> {
  children?: ReactNode;
  snapPoints?: string[] | number[];
}

type Ref = BottomSheetModal;

const CustomBottomSheetModal = forwardRef<Ref, Props>(
  ({ children, snapPoints, ...restProps }, ref) => {
    const defaultSnapPoints = useMemo(() => ['75%', '95%'], []);
    const usedSnapPoints = snapPoints ?? defaultSnapPoints;
    const animationConfigs = useBottomSheetTimingConfigs({ duration: 180 });

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
        ref={ref}
        snapPoints={usedSnapPoints}
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
