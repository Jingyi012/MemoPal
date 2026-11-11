import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appTextStyles, fontFamilies } from '@/theme/designSystem';
import { getBaseCardClassName } from '@/components/BaseCard';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View } from 'react-native';

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
      colors={['#EEE9FF', '#FFF0F4']}
      style={{
        borderRadius: 10,
      }}
      className={getBaseCardClassName({
        className: 'mt-6 border-2 border-[#E0D9FF] bg-transparent p-4',
        padding: 'none',
        bordered: false,
      })}>
      {/* Header */}
      <View className="mb-3 flex-row items-center gap-2">
        <Text style={{ fontSize: appArtworkSizes.small, lineHeight: appArtworkSizes.small + 4 }}>🧠</Text>
        <Text className="text-[#2B2A3D]" style={[appTextStyles.sectionTitle, { fontFamily: fontFamilies.bodySemibold }]}>Why This Works</Text>
      </View>

      {/* Points */}
      <View className="space-y-2 text-sm">
        {points.map((point, index) => (
          <View key={index} className="flex-row items-start gap-2">
            <Text className="text-[#7A68E0]">✓</Text>
            <View className="flex-1">
              <Text className="flex-wrap">
                <Text className="text-[#2B2A3D]" style={{ fontFamily: fontFamilies.bodyBold }}>{point.title}</Text>
                <Text className="text-[#6B6A80]"> - {point.description}</Text>
              </Text>
            </View>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
};
