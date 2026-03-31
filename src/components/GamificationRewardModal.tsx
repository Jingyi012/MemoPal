import AnimatedPressable from '@/components/AnimatedPressable';
import { RewardHighlights } from '@/components/rewards/RewardHighlights';
import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Award, History, Trophy } from 'lucide-react-native';
import React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  xpEarned?: number;
  levelUpTo?: number;
  milestones: string[];
  badges: string[];
  onClose: () => void;
};

export default function GamificationRewardModal({
  visible,
  xpEarned = 0,
  levelUpTo,
  milestones,
  badges,
  onClose,
}: Props) {
  const router = useRouter();
  const hasContent = xpEarned > 0 || !!levelUpTo || milestones.length > 0 || badges.length > 0;
  if (!hasContent) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <LinearGradient
        colors={[Colors.teal600, Colors.indigo600]}
        start={{ x: 0, y: 0.1 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View className="absolute left-[-20] top-[-20] h-48 w-48 rounded-full bg-white/10" />
        <View className="absolute bottom-10 right-[-30] h-64 w-64 rounded-full bg-black/10" />

        <View className="w-full max-w-md items-center rounded-[40px] bg-white/95 p-8 shadow-2xl">
          <View className="absolute -top-12 h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-teal-500 shadow-xl">
            <Award size={42} color="white" />
          </View>

          <View className="mt-10 items-center">
            <Text className="text-xs font-black uppercase tracking-[3px] text-teal-600">
              Progress Unlocked
            </Text>
            <Text className="mt-2 text-center text-3xl font-black text-slate-900">Great Work!</Text>
            <Text className="mt-2 text-center font-medium text-slate-500">
              Your latest session earned new rewards.
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 280, width: '100%' }}
            contentContainerStyle={{ paddingBottom: 4 }}
            className="mt-6">
            {xpEarned > 0 ? (
              <View className="mb-4 w-full rounded-2xl bg-amber-50 p-4">
                <Text className="text-sm font-bold text-amber-800">XP Earned</Text>
                <Text className="mt-2 text-2xl font-black text-amber-700">+{xpEarned} XP</Text>
              </View>
            ) : null}

            <RewardHighlights
              className="w-full"
              levelUpTo={levelUpTo}
              milestones={milestones}
              badges={badges}
              maxItemsPerType={6}
            />
          </ScrollView>

          <AnimatedPressable
            onPress={onClose}
            className="mt-5 w-full flex-row items-center justify-center rounded-2xl bg-slate-900 py-5 shadow-lg">
            <Trophy size={16} color="#ffffff" />
            <Text className="ml-2 text-lg font-black text-white">CONTINUE</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => {
              onClose();
              router.push('/rewards-history');
            }}
            className="mt-3 w-full flex-row items-center justify-center rounded-2xl bg-slate-100 py-4">
            <History size={18} color={Colors.slate500} />
            <Text className="ml-2 text-base font-bold text-slate-500">View Reward History</Text>
          </AnimatedPressable>

          <Text className="mt-6 text-xs font-bold uppercase tracking-widest text-slate-400">
            Keep Building Momentum
          </Text>
        </View>
      </LinearGradient>
    </Modal>
  );
}
