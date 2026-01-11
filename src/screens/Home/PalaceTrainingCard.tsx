import AnimatedPressable from '@/components/AnimatedPressable';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Play, Sparkles } from 'lucide-react-native';
import React from 'react';
import { Image, Text, View } from 'react-native';

interface PalaceTrainingCardProps {}

export const PalaceTrainingCard: React.FC<PalaceTrainingCardProps> = ({}) => {
  const router = useRouter();
  return (
    <View className="overflow-hidden rounded-3xl bg-white shadow-lg">
      <View className="relative h-60">
        {/* Background Gradient */}
        <LinearGradient
          colors={['#14b8a6', '#4f46e5']} // teal-600 → indigo-600
          className="absolute inset-0"
        />

        {/* Overlay Image */}
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
          }}
          className="absolute inset-0 h-full w-full opacity-30"
          resizeMode="cover"
        />

        {/* Content */}
        <View className="absolute inset-0 flex items-center justify-center p-6">
          <Sparkles size={40} color="white" style={{ marginBottom: 10 }} />
          <Text className="mb-2 text-center text-lg font-semibold text-white">
            Your First Memory Palace
          </Text>
          <Text className="mb-4 text-center text-sm text-teal-100">
            Master 10 familiar locations in 5 minutes
          </Text>

          <AnimatedPressable
            onPress={() => router.push('/palaces/beginner/training')}
            className="flex-row items-center gap-2 rounded-xl bg-white px-6 py-3 shadow-lg">
            <Play size={20} color="#14b8a6" />
            <Text className="text-base font-medium text-teal-600">Start Learning</Text>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
};
