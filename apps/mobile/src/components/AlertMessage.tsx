import { memopalThemes } from '@/theme/memopalTheme';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import AnimatedPressable from './AnimatedPressable';
import { useColorScheme } from 'nativewind';

interface AlertMessageProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  okLabel?: string;
  Icon?: React.ElementType;
  variant?: 'destructive' | 'primary';
}

export const AlertMessage: React.FC<AlertMessageProps> = ({
  isVisible,
  onClose,
  title,
  description,
  okLabel = 'OK',
  Icon,
  variant = 'primary',
}) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];

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
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={{ borderRadius: 32, backgroundColor: theme.paper }}
      handleIndicatorStyle={{ backgroundColor: theme.line, width: 48, height: 6 }}>
      <BottomSheetView className="p-6 pb-12">
        <View className="mb-8 items-center">
          {Icon && (
            <View
              className={`mb-4 h-16 w-16 items-center justify-center rounded-full ${
                variant === 'destructive' ? 'bg-[#FFF0F4]' : 'bg-[#EEE9FF]'
              }`}>
              <Icon size={32} color={variant === 'destructive' ? theme.berryDeep : theme.violetDeep} />
            </View>
          )}
          <Text className="text-center text-xl font-bold" style={{ color: theme.ink }}>{title}</Text>
          {description && (
            <Text className="mt-2 px-4 text-center leading-5" style={{ color: theme.inkSoft }}>{description}</Text>
          )}
        </View>

        <AnimatedPressable
          onPress={() => bottomSheetModalRef.current?.dismiss()}
          className={`${
            variant === 'destructive' ? 'bg-[#E8527A]' : 'bg-[#7A68E0]'
          } h-14 items-center justify-center rounded-2xl`}>
          <Text className="text-lg font-bold text-white">{okLabel}</Text>
        </AnimatedPressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
};
