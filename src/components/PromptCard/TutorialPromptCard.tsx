import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Brain } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import AnimatedPressable from '../AnimatedPressable';

interface TutorialCardProps {
  dismissTutorialPrompt: () => void;
  onViewTutorial: () => void;
}

const TutorialPromptCard: React.FC<TutorialCardProps> = ({ dismissTutorialPrompt, onViewTutorial }) => {
  const router = useRouter();
  return (
    <LinearGradient
      colors={[Colors.purple50, Colors.pink50]}
      style={{
        borderRadius: 10,
      }}
      className="border-2 border-purple-200 p-4 shadow-sm">
      <View className="flex-row items-center gap-3">
        {/* Icon */}
        <LinearGradient
          colors={[Colors.purple600, Colors.pink600]} // purple-600 → pink-600
          style={{
            borderRadius: 30,
          }}
          className="h-10 w-10 items-center justify-center">
          <Brain size={20} color="white" />
        </LinearGradient>

        {/* Text */}
        <View className="flex-1">
          <Text className="mb-1 text-base font-medium text-text">🎓 New to Memory Palaces?</Text>
          <Text className="text-sm text-text-muted">
            Learn how to use this technique in just 2 minutes
          </Text>
        </View>

        {/* Actions */}
        <View className="gap-1">
          <AnimatedPressable
            onPress={() => {
              onViewTutorial();
              router.push('/tutorial');
            }}>
            <LinearGradient
              colors={['#9333ea', '#db2777']}
              style={{
                borderRadius: 10,
              }}
              className="px-3 py-1.5">
              <Text className="text-xs font-medium text-white">View Tutorial</Text>
            </LinearGradient>
          </AnimatedPressable>

          <AnimatedPressable onPress={dismissTutorialPrompt}>
            <Text className="text-center text-xs text-text-muted">Dismiss</Text>
          </AnimatedPressable>
        </View>
      </View>
    </LinearGradient>
  );
};

export default TutorialPromptCard;
