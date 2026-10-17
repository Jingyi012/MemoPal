import { memopalTheme as theme } from '@/theme/memopalTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight } from '@/core/icons';
import React from 'react';
import { Text, View } from 'react-native';
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
              <Text className="text-xl">🧠</Text>
            </LinearGradient>

            <View className="flex-1">
              <Text className="mb-1 text-base font-medium text-[#2B2A3D]">New to Memory Palaces?</Text>
              <Text className="text-sm text-[#6B6A80]">
                Learn the core technique with a quick guided tutorial.
              </Text>
            </View>

            <ChevronRight size={20} color={theme.inkSoft} />
          </View>
        </View>
      </AnimatedPressable>

      <View className="mt-2 flex-row justify-end">
        <AnimatedPressable onPress={dismissTutorialPrompt} className="px-1 py-0.5">
          <Text className="text-xs text-[#6B6A80]">Dismiss</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
};

export default TutorialPromptCard;
