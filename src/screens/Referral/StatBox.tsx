import { JSX } from 'react';
import { Text, View } from 'react-native';

interface Props {
  icon: JSX.Element;
  value: number | string;
  label: string;
}

export const StatBox: React.FC<Props> = ({ icon, value, label }) => (
  <View className="flex-1 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
    <View className="mb-3 h-10 w-10 items-center justify-center rounded-2xl bg-slate-50">
      {icon}
    </View>
    <Text className="text-2xl font-bold text-slate-800">{value}</Text>
    <Text className="text-xs font-bold uppercase tracking-tight text-slate-400">{label}</Text>
  </View>
);
