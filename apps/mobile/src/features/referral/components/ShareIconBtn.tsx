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
    className="flex-1 items-center justify-center rounded-2xl border-2 border-[#EEE9DC] bg-[#F6F3EA] py-3">
    {icon}
    <Text className="mt-1 text-xs font-bold uppercase text-[#6B6A80]">{label}</Text>
  </TouchableOpacity>
);
