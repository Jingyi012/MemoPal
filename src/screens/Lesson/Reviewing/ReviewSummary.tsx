import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { REVIEW_PASS_THRESHOLD } from '@/constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Award, Target, Trophy, Zap } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

interface Props {
  isLearning: boolean;
  correctCount: number;
  totalSteps: number;
  xpEarned: number;
  streak: number;
  onFinish: () => void;
  onTryAgain?: () => void;
}

export const ReviewSummary: React.FC<Props> = ({
  isLearning,
  correctCount,
  totalSteps,
  xpEarned,
  streak,
  onFinish,
  onTryAgain,
}) => {
  const accuracy = correctCount / totalSteps;
  const percentage = Math.round(accuracy * 100);
  const isPassed = accuracy >= REVIEW_PASS_THRESHOLD;

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
        <View className="w-full flex-row flex-wrap justify-between">
          <StatItem
            delay={600}
            icon={<Target size={20} color="#6366f1" />}
            label="Recalled"
            value={`${correctCount}/${totalSteps}`}
          />
          {!isLearning && (
            <StatItem
              delay={700}
              icon={<Zap size={20} color="#f59e0b" />}
              label="XP Earned"
              value={`+${xpEarned.toLocaleString()}`}
            />
          )}

          {!isLearning && (
            <StatItem
              delay={800}
              icon={<Award size={20} color="#ec4899" />}
              label="Streak"
              value={`${streak}`}
            />
          )}

          {isLearning && (
            <StatItem
              delay={700}
              icon={<Trophy size={20} color="#10b981" />}
              label="Mode"
              value="Practice"
            />
          )}
        </View>

        {/* Failure Notice */}
        {!isPassed && (
          <Animated.View
            entering={FadeInDown.delay(900)}
            className="mb-6 w-full rounded-xl bg-orange-50 p-4">
            <Text className="text-center text-sm font-semibold text-orange-700">
              This review was not counted. Try again to improve your score!
            </Text>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(1000)} className="w-full">
          {!isPassed && onTryAgain ? (
            <View className="flex-col gap-3">
              <AnimatedPressable
                onPress={onTryAgain}
                className="w-full flex-row items-center justify-center rounded-2xl bg-slate-900 py-5 shadow-xl">
                <Text className="mr-2 text-lg font-black text-white">TRY AGAIN</Text>
                <ArrowRight size={20} color="white" strokeWidth={3} />
              </AnimatedPressable>
              <AnimatedPressable
                onPress={onFinish}
                className="w-full flex-row items-center justify-center rounded-2xl border-2 border-slate-300 bg-white py-5">
                <Text className="text-lg font-black text-slate-700">SKIP FOR NOW</Text>
              </AnimatedPressable>
            </View>
          ) : (
            <AnimatedPressable
              onPress={onFinish}
              className="w-full flex-row items-center justify-center rounded-2xl bg-slate-900 py-5 shadow-xl">
              <Text className="mr-2 text-lg font-black text-white">CONTINUE</Text>
              <ArrowRight size={20} color="white" strokeWidth={3} />
            </AnimatedPressable>
          )}
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
