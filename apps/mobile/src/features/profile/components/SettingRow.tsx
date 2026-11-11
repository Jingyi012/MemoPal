import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles, fontFamilies } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ChevronRight } from '@/core/icons';
import { ReactNode, useState } from 'react';
import { Switch, View } from 'react-native';

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
          <Text className="text-[#2B2A3D]" style={{ fontFamily: fontFamilies.bodySemibold }}>{title}</Text>
          {subtitle && <Text className="text-[#6B6A80]" style={appTextStyles.caption}>{subtitle}</Text>}
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
