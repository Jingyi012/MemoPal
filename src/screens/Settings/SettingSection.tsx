import { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface Props {
  title?: string;
  children: ReactNode;
}

export const SettingsSection: React.FC<Props> = ({ title, children }) => {
  return (
    <View className="mt-3 bg-white px-4 py-3">
      {title && <Text className="mb-2 text-sm font-semibold text-slate-500">{title}</Text>}
      <View className="gap-2">{children}</View>
    </View>
  );
};
