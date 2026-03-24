import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Router } from 'expo-router';
import { ChevronRight, Gift } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import AnimatedPressable from '../AnimatedPressable';

interface TutorialCardProps {
  router: Router;
}

const ReferrerPromptCard: React.FC<TutorialCardProps> = ({ router }) => {
  return (
    <AnimatedPressable onPress={() => router.push('/referral')}>
      <View className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <View className="flex-row items-center gap-3">
          {/* Icon */}
          <LinearGradient
            colors={[Colors.purple600, Colors.pink600]} // purple-600 → pink-600
            style={{
              borderRadius: 30,
            }}
            className="h-10 w-10 items-center justify-center">
            <Gift size={20} color="white" />
          </LinearGradient>

          {/* Text */}
          <View className="flex-1">
            <Text className="mb-1 text-base font-medium text-text">Refer Friends & Earn</Text>
            <Text className="text-sm text-text-muted">Get rewards for every referral</Text>
          </View>

          <View className="gap-1">
            <ChevronRight size={20} color={Colors.slate400} />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
};

export default ReferrerPromptCard;
