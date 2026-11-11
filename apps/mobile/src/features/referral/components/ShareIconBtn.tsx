import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles, fontFamilies } from '@/theme/designSystem';
import { JSX } from 'react';
import { TouchableOpacity } from 'react-native';

interface Props {
  icon: JSX.Element;
  label: string;
  onPress: () => void;
}
export const ShareIconBtn: React.FC<Props> = ({ icon, label, onPress }) => (
  <TouchableOpacity
    accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    className="flex-1 items-center justify-center rounded-2xl border-2 border-line-peach bg-tint-peach py-3">
    {icon}
    <Text className="mt-1 uppercase text-ink-soft" style={[appTextStyles.caption, { fontFamily: fontFamilies.bodyBold }]}>{label}</Text>
  </TouchableOpacity>
);
