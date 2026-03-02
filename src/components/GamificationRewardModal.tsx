import AnimatedPressable from '@/components/AnimatedPressable';
import React from 'react';
import { Modal, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  levelUpTo?: number;
  milestones: string[];
  badges: string[];
  onClose: () => void;
};

export default function GamificationRewardModal({ visible, levelUpTo, milestones, badges, onClose }: Props) {
  const hasContent = !!levelUpTo || milestones.length > 0 || badges.length > 0;
  if (!hasContent) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full rounded-2xl bg-white p-5">
          <Text className="text-xl font-bold text-slate-900">🎉 Achievement Unlocked</Text>

          {levelUpTo ? <Text className="mt-3 text-base text-teal-700">Level Up! You are now Level {levelUpTo}.</Text> : null}

          {milestones.length > 0 ? (
            <View className="mt-3">
              <Text className="font-semibold text-slate-800">Milestones</Text>
              {milestones.map((m) => (
                <Text key={m} className="mt-1 text-slate-600">• {m}</Text>
              ))}
            </View>
          ) : null}

          {badges.length > 0 ? (
            <View className="mt-3">
              <Text className="font-semibold text-slate-800">Badges</Text>
              {badges.map((b) => (
                <Text key={b} className="mt-1 text-slate-600">• {b}</Text>
              ))}
            </View>
          ) : null}

          <AnimatedPressable onPress={onClose} className="mt-5 items-center rounded-xl bg-slate-900 py-3">
            <Text className="font-semibold text-white">Continue</Text>
          </AnimatedPressable>
        </View>
      </View>
    </Modal>
  );
}
