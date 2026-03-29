import { BaseCard } from '@/components/BaseCard';
import { JSX } from 'react';
import { Text, View } from 'react-native';

interface Props {
  icon: JSX.Element;
  value: number | string;
  label: string;
}

export const StatBox: React.FC<Props> = ({ icon, value, label }) => (
  <BaseCard className="flex-1 rounded-3xl p-5">
    <View className="mb-3 h-10 w-10 items-center justify-center rounded-2xl bg-slate-50">
      {icon}
    </View>
    <Text className="text-2xl font-bold text-slate-800">{value}</Text>
    <Text className="text-xs font-bold uppercase tracking-tight text-slate-400">{label}</Text>
  </BaseCard>
);
