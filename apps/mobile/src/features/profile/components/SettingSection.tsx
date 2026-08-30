import { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface Props {
  title?: string;
  children: ReactNode;
}

export const SettingsSection: React.FC<Props> = ({ title, children }) => {
  return (
    <View className="mt-3 border-b-2 border-[#EEE9DC] bg-[#FFFDF8] px-4 py-3">
      {title && <Text className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#6B6A80]">{title}</Text>}
      <View className="gap-2">{children}</View>
    </View>
  );
};
