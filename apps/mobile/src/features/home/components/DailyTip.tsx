import { getBaseCardClassName } from '@/components/BaseCard';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Lightbulb } from 'lucide-react-native';

const DAILY_TIPS = [
  {
    title: 'Vivid Details Matter',
    tip: 'Make your mental images exaggerated and unusual. The more bizarre, the more memorable!',
    emoji: '🎨',
  },
  {
    title: 'Use Your Senses',
    tip: 'Engage all senses when placing information in your palace. See, hear, smell, taste, and touch.',
    emoji: '👃',
  },
  {
    title: 'Walk Your Palace',
    tip: 'Always traverse your palace in the same route. Consistency helps memory formation.',
    emoji: '🚶',
  },
  {
    title: 'Link Words Together',
    tip: 'Connect new words with existing palace locations using interactive, dynamic scenes.',
    emoji: '🔗',
  },
  {
    title: 'Spaced Repetition Works',
    tip: 'Review at increasing intervals (1 day, 3 days, 7 days, 30 days) for lasting retention.',
    emoji: '🔄',
  },
  {
    title: 'Start Small',
    tip: 'Begin with a familiar location like your home. Master the technique before scaling up.',
    emoji: '🏠',
  },
  {
    title: 'Emotion Enhances Memory',
    tip: 'Associate emotional responses with your palace locations. Feelings create stronger neural pathways.',
    emoji: '❤️',
  },
  {
    title: 'Practice Makes Perfect',
    tip: 'The more you use your palace, the better it becomes. Regular practice is key!',
    emoji: '⭐',
  },
];

interface DailyTipProps {
  dayOfMonth?: number;
}

export const DailyTip: React.FC<DailyTipProps> = ({ dayOfMonth }) => {
  const day = dayOfMonth ?? new Date().getDate();
  const tip = DAILY_TIPS[(day - 1) % DAILY_TIPS.length];

  return (
    <Animated.View
      entering={FadeInDown.delay(300)}
      className={getBaseCardClassName({
        className: 'mt-2 border-2 border-[#E0D9FF] bg-[#EEE9FF] p-4',
        padding: 'none',
      })}>
      <View className="flex-row gap-3">
        <View className="items-center justify-start pt-1">
          <Text className="text-3xl">{tip.emoji}</Text>
        </View>
        <View className="flex-1">
          <View className="mb-1 flex-row items-center gap-2">
            <Lightbulb size={16} color={theme.violetDeep} />
            <Text className="font-bold text-[#2B2A3D]">{tip.title}</Text>
          </View>
          <Text className="text-sm leading-5 text-[#6B6A80]">{tip.tip}</Text>
        </View>
      </View>
    </Animated.View>
  );
};
