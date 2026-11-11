import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles, fontFamilies } from '@/theme/designSystem';
import { memopalThemes } from '@/theme/memopalTheme';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import {
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedPressable from './AnimatedPressable';
import { useColorScheme } from 'nativewind';

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
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];

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
      backgroundStyle={{ backgroundColor: theme.paper, borderRadius: 32 }}
      handleIndicatorStyle={{ backgroundColor: theme.line, width: 48, height: 6 }}>
      <BottomSheetView
        className="px-6 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="mb-6 items-center">
          {Icon && (
            <View
              className={`mb-3 h-14 w-14 items-center justify-center rounded-full ${
                variant === 'destructive' ? 'bg-tint-berry' : 'bg-tint-violet'
              }`}>
              <Icon size={28} color={variant === 'destructive' ? theme.berryDeep : theme.violetDeep} />
            </View>
          )}
          <Text className="text-center text-ink" style={[appTextStyles.screenTitle, { fontFamily: fontFamilies.bodyBold }]}>{title}</Text>
          {description && (
            <Text className="mt-2 px-4 text-center leading-5 text-ink-soft">{description}</Text>
          )}
        </View>

        <View className="gap-3">
          <AnimatedPressable
            onPress={() => void handleAction()}
            disabled={isActing}
            className={`${
              variant === 'destructive' ? 'bg-berry-deep' : 'bg-secondary'
            } h-14 items-center justify-center rounded-2xl ${isActing ? 'opacity-70' : ''}`}>
            {isActing ? <ActivityIndicator color="white" /> : <Text className="text-white" style={[appTextStyles.sectionTitle, { fontFamily: fontFamilies.bodyBold }]}>{actionLabel}</Text>}
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => bottomSheetModalRef.current?.dismiss()}
            disabled={isActing}
            className="h-14 items-center justify-center rounded-2xl">
            <Text className="text-ink-soft" style={[appTextStyles.sectionTitle, { fontFamily: fontFamilies.bodySemibold }]}>{cancelLabel}</Text>
          </AnimatedPressable>
        </View>
      </BottomSheetView>
    </CustomBottomSheetModal>
  );
});

ActionSheet.displayName = 'ActionSheet';
