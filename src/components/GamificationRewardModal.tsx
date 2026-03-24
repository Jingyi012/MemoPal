import AnimatedPressable from '@/components/AnimatedPressable';
import { Sparkles, Star, Trophy } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  levelUpTo?: number;
  milestones: string[];
  badges: string[];
  onClose: () => void;
};

const SectionList = ({ title, items }: { title: string; items: string[] }) => {
  if (items.length === 0) return null;

  return (
    <View className="mt-4 rounded-xl bg-slate-50 p-3">
      <Text className="text-sm font-semibold text-slate-800">{title}</Text>
      {items.map((item) => (
        <Text key={item} className="mt-2 text-sm text-slate-600">
          - {item}
        </Text>
      ))}
    </View>
  );
};

export default function GamificationRewardModal({
  visible,
  levelUpTo,
  milestones,
  badges,
  onClose,
}: Props) {
  const router = useRouter();
  const hasContent = !!levelUpTo || milestones.length > 0 || badges.length > 0;
  if (!hasContent) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/45 px-6">
        <View className="w-full max-w-md rounded-2xl bg-white p-5">
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-teal-100">
              <Sparkles size={18} color="#0f766e" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-xl font-bold text-slate-900">Progress Unlocked</Text>
              <Text className="mt-0.5 text-sm text-slate-500">
                Great work. Your latest session earned rewards.
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 320 }}
            contentContainerStyle={{ paddingBottom: 4 }}>
            {levelUpTo ? (
              <View className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-3">
                <View className="flex-row items-center">
                  <Star size={16} color="#0f766e" />
                  <Text className="ml-2 text-base font-semibold text-teal-700">
                    Level Up: Level {levelUpTo}
                  </Text>
                </View>
                <Text className="mt-1 text-sm text-teal-700">
                  You advanced to the next level. Keep the momentum going.
                </Text>
              </View>
            ) : null}

            <SectionList title="Milestones Achieved" items={milestones} />
            <SectionList title="Badges Earned" items={badges} />
          </ScrollView>

          <AnimatedPressable
            onPress={onClose}
            className="mt-5 flex-row items-center justify-center rounded-xl bg-slate-900 py-3">
            <Trophy size={16} color="#ffffff" />
            <Text className="ml-2 font-semibold text-white">Continue</Text>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => {
              onClose();
              router.push('/rewards-history');
            }}
            className="mt-2 items-center rounded-xl bg-slate-100 py-3">
            <Text className="font-semibold text-slate-700">View Reward History</Text>
          </AnimatedPressable>
        </View>
      </View>
    </Modal>
  );
}
