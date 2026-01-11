import React from 'react';
import { Modal, Text, TouchableWithoutFeedback, View } from 'react-native';
import AnimatedPressable from './AnimatedPressable';

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
            <View className="w-full rounded-2xl bg-white p-5">
              <Text className="text-center text-lg font-semibold text-neutral-900">{title}</Text>

              {description && (
                <Text className="mt-2 text-center text-sm text-neutral-500">{description}</Text>
              )}

              <View className="mt-6 flex-row gap-3">
                <AnimatedPressable
                  onPress={onCancel}
                  className="flex-1 items-center justify-center rounded-xl bg-neutral-100 py-3">
                  <Text className="text-base text-neutral-700">{cancelText}</Text>
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={onConfirm}
                  className={[
                    'flex-1 items-center justify-center rounded-xl py-3',
                    destructive ? 'bg-red-500' : 'bg-blue-500',
                  ].join(' ')}>
                  <Text className="text-base font-medium text-white">{confirmText}</Text>
                </AnimatedPressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
