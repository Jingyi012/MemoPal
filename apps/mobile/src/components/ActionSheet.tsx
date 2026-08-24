import { Colors } from '@/constants/colors';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import AnimatedPressable from './AnimatedPressable';

interface ActionSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onAction: () => void;
  title: string;
  description?: string;
  actionLabel: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'primary';
  Icon?: React.ElementType;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  isVisible,
  onClose,
  onAction,
  title,
  description,
  actionLabel,
  cancelLabel = 'Cancel',
  variant = 'destructive',
  Icon,
}) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  //const snapPoints = useMemo(() => ['50%'], []);

  useEffect(() => {
    if (isVisible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [isVisible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      //snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={{ borderRadius: 32 }}
      handleIndicatorStyle={{ backgroundColor: '#E5E7EB', width: 48, height: 6 }}>
      <BottomSheetView className="p-6 pb-12">
        <View className="mb-8 items-center">
          {Icon && (
            <View
              className={`mb-4 h-16 w-16 items-center justify-center rounded-full ${
                variant === 'destructive' ? 'bg-red-50' : 'bg-teal-50'
              }`}>
              <Icon size={32} color={variant === 'destructive' ? Colors.red600 : Colors.teal600} />
            </View>
          )}
          <Text className="text-center text-xl font-bold text-slate-800">{title}</Text>
          {description && (
            <Text className="mt-2 px-4 text-center leading-5 text-slate-600">{description}</Text>
          )}
        </View>

        <View className="gap-3">
          <AnimatedPressable
            onPress={() => {
              onAction();
              bottomSheetModalRef.current?.dismiss();
            }}
            className={`${
              variant === 'destructive' ? 'bg-red-500' : 'bg-teal-600'
            } h-14 items-center justify-center rounded-2xl`}>
            <Text className="text-lg font-bold text-white">{actionLabel}</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => bottomSheetModalRef.current?.dismiss()}
            className="h-14 items-center justify-center rounded-2xl">
            <Text className="text-lg font-semibold text-slate-600">{cancelLabel}</Text>
          </AnimatedPressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};
