import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles, fontFamilies } from '@/theme/designSystem';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight } from '@/core/icons';
import React from 'react';
import { View } from 'react-native';
import AnimatedPressable from '../AnimatedPressable';
import { getBaseCardClassName } from '../BaseCard';

interface TutorialCardProps {
  dismissTutorialPrompt: () => void;
  onViewTutorial: () => void;
}

const TutorialPromptCard: React.FC<TutorialCardProps> = ({
  dismissTutorialPrompt,
  onViewTutorial,
}) => {
  const router = useRouter();

  const openTutorial = () => {
    onViewTutorial();
    router.push('/tutorial');
  };

  return (
    <View>
      <AnimatedPressable onPress={openTutorial}>
        <View className={getBaseCardClassName({ padding: 'md', radius: '2xl', shadow: 'sm' })}>
          <View className="flex-row items-center gap-3">
            <LinearGradient
              colors={[theme.violetDeep, theme.berryDeep]}
              style={{
                borderRadius: 30,
              }}
              className="h-10 w-10 items-center justify-center">
              <Text style={appTextStyles.screenTitle}>🧠</Text>
            </LinearGradient>

            <View className="flex-1">
              <Text className="mb-1 text-[#2B2A3D]" style={[appTextStyles.body, { fontFamily: fontFamilies.bodySemibold }]}>New to Memory Palaces?</Text>
              <Text className="text-[#6B6A80]" style={appTextStyles.label}>
                Learn the core technique with a quick guided tutorial.
              </Text>
            </View>

            <ChevronRight size={20} color={theme.inkSoft} />
          </View>
        </View>
      </AnimatedPressable>

      <View className="mt-2 flex-row justify-end">
        <AnimatedPressable onPress={dismissTutorialPrompt} className="px-1 py-0.5">
          <Text className="text-[#6B6A80]" style={appTextStyles.caption}>Dismiss</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
};

export default TutorialPromptCard;
