import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles, fontFamilies } from '@/theme/designSystem';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Router } from 'expo-router';
import { ChevronRight } from '@/core/icons';
import React from 'react';
import { View } from 'react-native';
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
            <Text style={appTextStyles.screenTitle}>🎁</Text>
          </LinearGradient>

          {/* Text */}
          <View className="flex-1">
            <Text className="mb-1 text-[#2B2A3D]" style={[appTextStyles.body, { fontFamily: fontFamilies.bodySemibold }]}>Refer Friends & Earn</Text>
            <Text className="text-[#6B6A80]" style={appTextStyles.label}>Get rewards for every referral</Text>
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
