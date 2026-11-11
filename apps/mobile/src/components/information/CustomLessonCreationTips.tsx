import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles, fontFamilies } from '@/theme/designSystem';
import React from 'react';
import { View } from 'react-native';

export const CustomLessonCreationTips: React.FC = () => {
  return (
    <View className="rounded-2xl border-2 border-line-peach bg-tint-peach p-4">
      <Text className="mb-2 text-[#7A68E0]" style={[appTextStyles.body, { fontFamily: fontFamilies.bodySemibold }]}>
        💡 Tips for Creating Lessons
      </Text>

      <View className="space-y-1">
        <Text className="text-[#6B6A80]" style={appTextStyles.label}>
          • Choose words from the same category (e.g., all food items)
        </Text>
        <Text className="text-[#6B6A80]" style={appTextStyles.label}>• Add translations to help with learning</Text>
        <Text className="text-[#6B6A80]" style={appTextStyles.label}>• Use clear and simple words</Text>
        <Text className="text-[#6B6A80]" style={appTextStyles.label}>• Make it public to share with the community</Text>
        <Text className="text-[#6B6A80]" style={appTextStyles.label}>• You can create up to 10 custom lessons</Text>
      </View>
    </View>
  );
};
