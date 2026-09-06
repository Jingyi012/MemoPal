import AnimatedPressable from '@/components/AnimatedPressable';
import { ChevronRight } from 'lucide-react-native';
import { ReactNode, useState } from 'react';
import { Switch, Text, View } from 'react-native';

interface Props {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  right?: 'switch' | 'chevron';
  onPress?: () => void;
  switchValue?: boolean; // optional initial value
  onSwitchChange?: (value: boolean) => void; // callback when switch changes
}

export const SettingsRow: React.FC<Props> = ({
  icon,
  title,
  subtitle,
  right = 'chevron',
  onPress,
  switchValue = false,
  onSwitchChange,
}) => {
  const [isEnabled, setIsEnabled] = useState(switchValue);

  const toggleSwitch = () => {
    setIsEnabled((prev) => !prev);
    onSwitchChange?.(!isEnabled);
  };

  const content = (
    <View className="flex-row items-center justify-between rounded-2xl border-2 border-[#E5DFFF] bg-white p-4">
      <View className="flex-row items-center gap-3">
        {icon}
        <View>
          <Text className="font-semibold text-[#2B2A3D]">{title}</Text>
          {subtitle && <Text className="text-xs text-[#6B6A80]">{subtitle}</Text>}
        </View>
      </View>

      {right === 'switch' ? (
        <Switch value={isEnabled} onValueChange={toggleSwitch} />
      ) : (
        <ChevronRight size={18} color="#9A97A7" />
      )}
    </View>
  );

  if (!onPress) return content;

  return <AnimatedPressable onPress={onPress}>{content}</AnimatedPressable>;
};
