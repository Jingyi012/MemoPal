import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles, fontFamilies } from '@/theme/designSystem';
import { ReactNode } from 'react';
import { View } from 'react-native';

interface Props {
  title?: string;
  children: ReactNode;
}

export const SettingsSection: React.FC<Props> = ({ title, children }) => {
  return (
    <View className="mt-3 border-b-2 border-[#E5DFFF] bg-white px-4 py-3">
      {title && <Text className="mb-2 uppercase tracking-wider text-[#6B6A80]" style={[appTextStyles.label, { fontFamily: fontFamilies.bodySemibold }]}>{title}</Text>}
      <View className="gap-2">{children}</View>
    </View>
  );
};
