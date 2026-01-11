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
    <View className="flex-row items-center justify-between rounded-xl bg-slate-50 p-4">
      <View className="flex-row items-center gap-3">
        {icon}
        <View>
          <Text className="font-semibold text-slate-900">{title}</Text>
          {subtitle && <Text className="text-xs text-slate-500">{subtitle}</Text>}
        </View>
      </View>

      {right === 'switch' ? (
        <Switch value={isEnabled} onValueChange={toggleSwitch} />
      ) : (
        <ChevronRight size={18} color="#94a3b8" />
      )}
    </View>
  );

  if (!onPress) return content;

  return <AnimatedPressable onPress={onPress}>{content}</AnimatedPressable>;
};
