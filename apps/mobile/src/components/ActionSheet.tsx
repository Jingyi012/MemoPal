import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import {
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedPressable from './AnimatedPressable';

interface ActionSheetProps {
  onClose?: () => void;
  onAction: () => void | Promise<void>;
  title: string;
  description?: string;
  actionLabel: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'primary';
  Icon?: React.ElementType;
}

export const ActionSheet = forwardRef<BottomSheetModal, ActionSheetProps>(({
  onClose,
  onAction,
  title,
  description,
  actionLabel,
  cancelLabel = 'Cancel',
  variant = 'destructive',
  Icon,
}, ref) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [isActing, setIsActing] = useState(false);
  const insets = useSafeAreaInsets();

  useImperativeHandle(ref, () => bottomSheetModalRef.current!, []);

  const handleAction = async () => {
    if (isActing) return;

    setIsActing(true);
    try {
      await onAction();
      bottomSheetModalRef.current?.dismiss();
    } finally {
      setIsActing(false);
    }
  };

  return (
    <CustomBottomSheetModal
      ref={bottomSheetModalRef}
      enableDynamicSizing
      onDismiss={onClose}
      backgroundStyle={{ backgroundColor: '#FFFDF8', borderRadius: 32 }}
      handleIndicatorStyle={{ backgroundColor: theme.line, width: 48, height: 6 }}>
      <BottomSheetView
        className="px-6 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="mb-6 items-center">
          {Icon && (
            <View
              className={`mb-3 h-14 w-14 items-center justify-center rounded-full ${
                variant === 'destructive' ? 'bg-[#FFF0F4]' : 'bg-[#EEE9FF]'
              }`}>
              <Icon size={28} color={variant === 'destructive' ? theme.berryDeep : theme.violetDeep} />
            </View>
          )}
          <Text className="text-center text-xl font-bold text-[#2B2A3D]">{title}</Text>
          {description && (
            <Text className="mt-2 px-4 text-center leading-5 text-[#6B6A80]">{description}</Text>
          )}
        </View>

        <View className="gap-3">
          <AnimatedPressable
            onPress={() => void handleAction()}
            disabled={isActing}
            className={`${
              variant === 'destructive' ? 'bg-[#E8527A]' : 'bg-[#7A68E0]'
            } h-14 items-center justify-center rounded-2xl ${isActing ? 'opacity-70' : ''}`}>
            {isActing ? <ActivityIndicator color="white" /> : <Text className="text-lg font-bold text-white">{actionLabel}</Text>}
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => bottomSheetModalRef.current?.dismiss()}
            disabled={isActing}
            className="h-14 items-center justify-center rounded-2xl">
            <Text className="text-lg font-semibold text-[#6B6A80]">{cancelLabel}</Text>
          </AnimatedPressable>
        </View>
      </BottomSheetView>
    </CustomBottomSheetModal>
  );
});

ActionSheet.displayName = 'ActionSheet';
