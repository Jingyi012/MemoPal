import AnimatedPressable from '@/components/AnimatedPressable';
import { RewardHighlights } from '@/components/rewards/RewardHighlights';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
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
        colors={[theme.ink, '#1E1A30']}
        start={{ x: 0, y: 0.1 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View className="absolute left-[-20] top-[-20] h-48 w-48 rounded-full bg-white/10" />
        <View className="absolute bottom-10 right-[-30] h-64 w-64 rounded-full bg-black/10" />

        <View className="w-full max-w-md items-center rounded-[40px] bg-white/95 p-8 shadow-2xl">
          <View className="absolute -top-12 h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-[#FFC93C] shadow-xl">
            <Award size={42} color="white" />
          </View>

          <View className="mt-10 items-center">
            <Text className="text-xs font-black uppercase tracking-[3px] text-[#E8527A]">
              Progress Unlocked
            </Text>
            <Text className="mt-2 text-center text-3xl font-black text-[#2B2A3D]">Great Work!</Text>
            <Text className="mt-2 text-center font-medium text-[#6B6A80]">
              Your latest session earned new rewards.
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 280, width: '100%' }}
            contentContainerStyle={{ paddingBottom: 4 }}
            className="mt-6">
            {xpEarned > 0 ? (
              <View className="mb-4 w-full rounded-2xl bg-[#FFF7E0] p-4">
                <Text className="text-sm font-bold text-[#F2A900]">XP Earned</Text>
                <Text className="mt-2 text-2xl font-black text-[#F2A900]">+{xpEarned} XP</Text>
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
            className="mt-5 w-full flex-row items-center justify-center rounded-2xl bg-[#FFC93C] py-5 shadow-lg">
            <Trophy size={16} color={theme.ink} />
            <Text className="ml-2 text-lg font-black text-[#2B2A3D]">CONTINUE</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => {
              onClose();
              router.push('/rewards-history');
            }}
            className="mt-3 w-full flex-row items-center justify-center rounded-2xl bg-[#F6F3EA] py-4">
            <History size={18} color={theme.inkSoft} />
            <Text className="ml-2 text-base font-bold text-[#6B6A80]">View Reward History</Text>
          </AnimatedPressable>

          <Text className="mt-6 text-xs font-bold uppercase tracking-widest text-[#9A97A7]">
            Keep Building Momentum
          </Text>
        </View>
      </LinearGradient>
    </Modal>
  );
}
