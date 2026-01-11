import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { forwardRef, ReactNode, useMemo } from 'react';

interface Props {
  title?: string;
  children?: ReactNode;
}
type Ref = BottomSheet;

const CustomBottomSheet = forwardRef<Ref, Props>((props, ref) => {
  const snapPoints = useMemo(() => ['50%', '75%', '95%'], []);

  const renderBackdrop = (backdropProps: any) => (
    <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} />
  );

  return (
    <BottomSheet
      index={-1}
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}>
      <BottomSheetScrollView>{props.children}</BottomSheetScrollView>
    </BottomSheet>
  );
});

export default CustomBottomSheet;
