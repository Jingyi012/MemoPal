import { BottomSheetBackdrop, BottomSheetModal, BottomSheetModalProps } from '@gorhom/bottom-sheet';
import React, { forwardRef, ReactNode, useMemo } from 'react';

interface Props extends Partial<BottomSheetModalProps> {
  children?: ReactNode;
  snapPoints?: string[] | number[];
}

type Ref = BottomSheetModal;

const CustomBottomSheetModal = forwardRef<Ref, Props>(
  ({ children, snapPoints, ...restProps }, ref) => {
    const defaultSnapPoints = useMemo(() => ['75%', '95%'], []);
    const usedSnapPoints = snapPoints ?? defaultSnapPoints;

    const renderBackdrop = (backdropProps: any) => (
      <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} />
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={usedSnapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        {...restProps}>
        {children}
      </BottomSheetModal>
    );
  }
);

export default CustomBottomSheetModal;
