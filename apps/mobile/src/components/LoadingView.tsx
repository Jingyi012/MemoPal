import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface Props {
  description?: string;
}

const LoadingView: React.FC<Props> = ({ description }) => {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator color={theme.violetDeep} size="large" />
      {description && <Text className="mt-4 font-medium text-[#6B6A80]">{description}</Text>}
    </View>
  );
};

export default LoadingView;
