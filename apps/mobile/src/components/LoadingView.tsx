import { AppText as Text } from '@/components/ui/AppText';
import { fontFamilies } from '@/theme/designSystem';
import { useColorScheme } from 'nativewind';
import { memopalThemes } from '@/theme/memopalTheme';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

interface Props {
  description?: string;
}

const LoadingView: React.FC<Props> = ({ description }) => {
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: activeTheme.canvas }}>
      <ActivityIndicator color={activeTheme.violetDeep} size="large" />
      {description && <Text className="mt-4" style={[{ fontFamily: fontFamilies.bodySemibold }, { color: activeTheme.inkSoft }]}>{description}</Text>}
    </View>
  );
};

export default LoadingView;
