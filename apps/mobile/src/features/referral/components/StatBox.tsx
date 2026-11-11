import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles, fontFamilies } from '@/theme/designSystem';
import { BaseCard } from '@/components/BaseCard';
import { JSX } from 'react';
import { View } from 'react-native';

interface Props {
  icon: JSX.Element;
  value: number | string;
  label: string;
}

export const StatBox: React.FC<Props> = ({ icon, value, label }) => (
  <BaseCard className="flex-1 rounded-2xl p-3">
    <View className="mb-3 h-10 w-10 items-center justify-center rounded-2xl bg-tint-mint">
      {icon}
    </View>
    <Text className="text-ink" style={[appTextStyles.screenTitle, { fontFamily: fontFamilies.bodyBold }]}>{value}</Text>
    <Text className="uppercase tracking-tight text-ink-soft" style={[appTextStyles.caption, { fontFamily: fontFamilies.bodyBold }]}>{label}</Text>
  </BaseCard>
);
