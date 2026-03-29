import { getBaseCardClassName } from '@/components/BaseCard';
import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Point {
  title: string;
  description: string;
}

export const WhyThisWorkCard: React.FC = () => {
  const points: Point[] = [
    { title: '2500 years old', description: 'Used since ancient Greece' },
    { title: 'Science-backed', description: 'Proven by modern research' },
    { title: 'Memory champions', description: 'How pros remember thousands of items' },
  ];

  return (
    <LinearGradient
      colors={[Colors.purple50, Colors.pink50]}
      style={{
        borderRadius: 10,
      }}
      className={getBaseCardClassName({
        className: 'mt-6 border-2 border-purple-200 bg-transparent p-4',
        padding: 'none',
        bordered: false,
      })}>
      {/* Header */}
      <View className="mb-3 flex-row items-center gap-2">
        <Brain size={20} color="#9333ea" />
        <Text className="text-lg font-semibold text-text">Why This Works</Text>
      </View>

      {/* Points */}
      <View className="space-y-2 text-sm">
        {points.map((point, index) => (
          <View key={index} className="flex-row items-start gap-2">
            <Text className="text-purple-600 dark:text-purple-300">✓</Text>
            <View className="flex-1">
              <Text className="flex-wrap">
                <Text className="font-bold text-text">{point.title}</Text>
                <Text className="text-text-muted"> - {point.description}</Text>
              </Text>
            </View>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
};
