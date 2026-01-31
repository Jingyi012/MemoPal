import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Award, Target, Trophy, Zap } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

interface Props {
  correctCount: number;
  totalSteps: number;
  onFinish: () => void;
}

export const ReviewSummary: React.FC<Props> = ({ correctCount, totalSteps, onFinish }) => {
  const percentage = Math.round((correctCount / totalSteps) * 100);

  const getRank = () => {
    if (percentage === 100) return { label: 'S', color: '#fbbf24', title: 'Palace Master' };
    if (percentage >= 80) return { label: 'A', color: '#f87171', title: 'Memory Expert' };
    if (percentage >= 60) return { label: 'B', color: '#60a5fa', title: 'Learner' };
    return { label: 'C', color: '#94a3b8', title: 'Novice' };
  };

  const rank = getRank();

  return (
    <LinearGradient
      colors={[Colors.teal600, Colors.indigo600]}
      start={{ x: 0, y: 0.1 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      {/* Background Decorative Circles */}
      <View className="absolute left-[-50] top-[-50] h-64 w-64 rounded-full bg-white/10" />
      <View className="absolute bottom-[-50] right-[-50] h-80 w-80 rounded-full bg-black/10" />

      <Animated.View
        entering={ZoomIn.delay(200)}
        className="w-full items-center rounded-[40px] bg-white/95 p-8 shadow-2xl">
        {/* Rank Badge */}
        <Animated.View
          entering={FadeInUp.delay(400)}
          style={{ backgroundColor: rank.color }}
          className="absolute -top-10 h-20 w-20 items-center justify-center rounded-full border-4 border-white shadow-lg">
          <Text className="text-4xl font-black text-white">{rank.label}</Text>
        </Animated.View>

        <View className="mt-8 items-center">
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Session Complete
          </Text>
          <Text className="mt-1 text-3xl font-black text-slate-900">{rank.title}</Text>
        </View>

        {/* Score Circle */}
        <View className="my-8 items-center justify-center">
          <Text className="text-7xl font-black text-slate-900">{percentage}%</Text>
          <Text className="font-medium text-slate-500">Recall Accuracy</Text>
        </View>

        {/* Stats Grid */}
        <View className="mb-8 w-full flex-row flex-wrap justify-between">
          <StatItem
            delay={600}
            icon={<Target size={20} color="#6366f1" />}
            label="Recalled"
            value={`${correctCount}/${totalSteps}`}
          />
          <StatItem
            delay={700}
            icon={<Zap size={20} color="#f59e0b" />}
            label="Points"
            value={(correctCount * 150).toLocaleString()}
          />
          <StatItem
            delay={800}
            icon={<Trophy size={20} color="#10b981" />}
            label="Bonus"
            value={percentage === 100 ? '+500' : '0'}
          />
          <StatItem
            delay={900}
            icon={<Award size={20} color="#ec4899" />}
            label="Streak"
            value="MAX"
          />
        </View>

        {/* Action Button */}
        <Animated.View entering={FadeInDown.delay(1000)} className="w-full">
          <AnimatedPressable
            onPress={onFinish}
            className="w-full flex-row items-center justify-center rounded-2xl bg-slate-900 py-5 shadow-xl">
            <Text className="mr-2 text-lg font-black text-white">CONTINUE</Text>
            <ArrowRight size={20} color="white" strokeWidth={3} />
          </AnimatedPressable>
        </Animated.View>
      </Animated.View>

      <Animated.Text
        entering={FadeInUp.delay(1200)}
        className="mt-8 font-medium italic text-white/60">
        Keep practicing to solidify these pathways!
      </Animated.Text>
    </LinearGradient>
  );
};

// Sub-component for individual stats
const StatItem = ({
  icon,
  label,
  value,
  delay,
}: {
  icon: any;
  label: string;
  value: string;
  delay: number;
}) => (
  <Animated.View
    entering={FadeInDown.delay(delay)}
    className="mb-3 w-[48%] flex-row items-center rounded-2xl bg-slate-50 p-4">
    <View className="mr-3 rounded-xl bg-white p-2 shadow-sm">{icon}</View>
    <View>
      <Text className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
        {label}
      </Text>
      <Text className="text-sm font-black text-slate-800">{value}</Text>
    </View>
  </Animated.View>
);
