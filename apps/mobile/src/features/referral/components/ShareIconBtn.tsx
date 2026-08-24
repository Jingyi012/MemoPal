import { JSX } from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface Props {
  icon: JSX.Element;
  label: string;
  onPress: () => void;
}
export const ShareIconBtn: React.FC<Props> = ({ icon, label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-1 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 py-3">
    {icon}
    <Text className="mt-1 text-xs font-bold uppercase text-slate-500">{label}</Text>
  </TouchableOpacity>
);
