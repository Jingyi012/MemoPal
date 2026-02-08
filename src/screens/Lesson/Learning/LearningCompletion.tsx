import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Award, BookOpen, ChevronRight, Home, Sparkles } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';

interface Props {
  palaceId: string;
  lessonId: string;
  stepsCount: number;
  earnedXp: number;
}

export const LearningCompletion: React.FC<Props> = ({
  palaceId,
  lessonId,
  stepsCount,
  earnedXp,
}) => {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[Colors.teal600, Colors.indigo600]}
      start={{ x: 0, y: 0.1 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      {/* Background Decorative Elements */}
      <View className="absolute left-[-20] top-[-20] h-48 w-48 rounded-full bg-white/10" />
      <View className="absolute bottom-10 right-[-30] h-64 w-64 rounded-full bg-black/10" />

      <Animated.View
        entering={ZoomIn.duration(600)}
        className="w-full items-center rounded-[40px] bg-white/95 p-8 shadow-2xl">
        {/* Milestone Icon */}
        <Animated.View
          entering={FadeInUp.delay(300)}
          className="absolute -top-12 h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-teal-500 shadow-xl">
          <Award size={42} color="white" />
        </Animated.View>

        <View className="mt-10 items-center">
          <Text className="text-xs font-black uppercase tracking-[3px] text-teal-600">
            Lesson Complete
          </Text>
          <Text className="mt-2 text-center text-3xl font-black text-slate-900">
            Memory Secured!
          </Text>
          <Text className="mt-2 text-center font-medium text-slate-500">
            You've successfully mapped {stepsCount} new words in your mind palace.
          </Text>
        </View>

        {/* Stats Grid */}
        {earnedXp > 0 ? (
          <View className="my-8 w-full flex-row justify-between">
            <StatBox
              delay={500}
              icon={<Sparkles size={20} color="#f59e0b" />}
              label="XP Gained"
              value={`+${earnedXp}`}
            />
            <StatBox
              delay={600}
              icon={<BookOpen size={20} color="#6366f1" />}
              label="Words"
              value={stepsCount.toString()}
            />
          </View>
        ) : (
          <View className="my-3 w-full flex-row justify-between"></View>
        )}

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(800)} className="w-full space-y-3">
          <AnimatedPressable
            onPress={() => router.replace(`/lessons/${lessonId}/review?isLearningMode=true`)}
            className="flex-row items-center justify-center rounded-2xl bg-slate-900 py-5 shadow-lg">
            <Text className="mr-2 text-lg font-black text-white">START REVIEW</Text>
            <ChevronRight size={20} color="white" strokeWidth={3} />
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => router.replace(`/lessons/${lessonId}`)}
            className="flex-row items-center justify-center rounded-2xl bg-slate-100 py-4">
            <Home size={18} color="#64748b" className="mr-2" />
            <Text className="ml-3 text-base font-bold text-slate-500">Back</Text>
          </AnimatedPressable>
        </Animated.View>
      </Animated.View>

      <Animated.Text
        entering={FadeInUp.delay(1000)}
        className="mt-8 text-xs font-bold uppercase tracking-widest text-white/70">
        Next Step: Immediate Recall
      </Animated.Text>
    </LinearGradient>
  );
};

const StatBox = ({
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
    className="w-[47%] items-center rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
    <View className="mb-1 rounded-full bg-white p-2 shadow-sm">{icon}</View>
    <Text className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">{label}</Text>
    <Text className="text-xl font-black text-slate-800">{value}</Text>
  </Animated.View>
);
