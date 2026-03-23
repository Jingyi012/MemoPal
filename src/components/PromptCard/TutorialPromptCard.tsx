import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Brain, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import AnimatedPressable from '../AnimatedPressable';

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
        <LinearGradient
          colors={[Colors.purple50, Colors.pink50]}
          style={{
            borderRadius: 10,
          }}
          className="border-2 border-purple-200 p-4 shadow-sm">
          <View className="flex-row items-center gap-3">
            <LinearGradient
              colors={[Colors.purple600, Colors.pink600]}
              style={{
                borderRadius: 30,
              }}
              className="h-10 w-10 items-center justify-center">
              <Brain size={20} color="white" />
            </LinearGradient>

            <View className="flex-1">
              <Text className="mb-1 text-base font-medium text-text">
                New to Memory Palaces?
              </Text>
              <Text className="text-sm text-text-muted">
                Learn the core technique with a quick guided tutorial.
              </Text>
            </View>

            <ChevronRight size={20} color={Colors.slate400} />
          </View>
        </LinearGradient>
      </AnimatedPressable>

      <View className="mt-2 flex-row justify-end">
        <AnimatedPressable onPress={dismissTutorialPrompt} className="px-1 py-0.5">
          <Text className="text-xs text-text-muted">Dismiss</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
};

export default TutorialPromptCard;
