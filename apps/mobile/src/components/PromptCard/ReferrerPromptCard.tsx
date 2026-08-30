import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import AnimatedPressable from '../AnimatedPressable';
import { getBaseCardClassName } from '../BaseCard';

interface TutorialCardProps {
  router: Router;
}

const ReferrerPromptCard: React.FC<TutorialCardProps> = ({ router }) => {
  return (
    <AnimatedPressable onPress={() => router.push('/referral')}>
      <View className={getBaseCardClassName({ padding: 'md', radius: '2xl', shadow: 'sm' })}>
        <View className="flex-row items-center gap-3">
          {/* Icon */}
          <LinearGradient
            colors={[theme.violetDeep, theme.berryDeep]}
            style={{
              borderRadius: 30,
            }}
            className="h-10 w-10 items-center justify-center">
            <Text className="text-xl">🎁</Text>
          </LinearGradient>

          {/* Text */}
          <View className="flex-1">
            <Text className="mb-1 text-base font-medium text-[#2B2A3D]">Refer Friends & Earn</Text>
            <Text className="text-sm text-[#6B6A80]">Get rewards for every referral</Text>
          </View>

          <View className="gap-1">
            <ChevronRight size={20} color={theme.inkSoft} />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
};

export default ReferrerPromptCard;
