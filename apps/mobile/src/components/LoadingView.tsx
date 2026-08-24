import { Colors } from '@/constants/colors';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface Props {
  description?: string;
}

const LoadingView: React.FC<Props> = ({ description }) => {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator color={Colors.teal500} size="large" />
      {description && <Text className="mt-4 font-medium text-slate-400">{description}</Text>}
    </View>
  );
};

export default LoadingView;
