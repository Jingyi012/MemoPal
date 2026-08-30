import React from 'react';
import { Modal, Text, TouchableWithoutFeedback, View } from 'react-native';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import AnimatedPressable from './AnimatedPressable';
import { BaseCard } from './BaseCard';

interface ConfirmModalProps {
  visible: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onCancel}>
        <View className="flex-1 items-center justify-center bg-black/40 px-10">
          {/* Card */}
          <TouchableWithoutFeedback>
            <BaseCard className="w-full" padding="lg" radius="2xl" bordered={false} shadow="sm">
          <Text className="text-center text-lg font-semibold text-[#2B2A3D]">{title}</Text>

              {description && (
                <Text className="mt-2 text-center text-sm text-[#6B6A80]">{description}</Text>
              )}

              <View className="mt-6 flex-row gap-3">
                <AnimatedPressable
                  onPress={onCancel}
                  className="flex-1 items-center justify-center rounded-xl bg-[#F6F3EA] py-3">
                  <Text className="text-base text-[#6B6A80]">{cancelText}</Text>
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={onConfirm}
                  className={[
                    'flex-1 items-center justify-center rounded-xl py-3',
                    destructive ? 'bg-[#E8527A]' : 'bg-[#FFC93C]',
                  ].join(' ')}>
                  <Text className="text-base font-medium" style={{ color: destructive ? '#FFFFFF' : theme.ink }}>
                    {confirmText}
                  </Text>
                </AnimatedPressable>
              </View>
            </BaseCard>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
