import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, LucideIcon } from 'lucide-react-native';
import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';
import AnimatedPressable from './AnimatedPressable';
import HomeButton from './HomeButton';
import { NotificationBell } from './NotificationBell';

interface Actions {
  icon?: LucideIcon;
  onPress?: () => void;
  component?: ReactNode;
}

interface HeaderProps {
  title: string;
  description: ReactNode;
  actions?: Actions[];
  additionalContent?: ReactNode;
  /** Optional override for the back button slot */
  leftComponent?: ReactNode;
  /** Disable back button entirely */
  hideBackButton?: boolean;
  backAction?: () => void;
  showNotification?: boolean;
  showHomeButton?: boolean;
}

export const CommonHeader: React.FC<HeaderProps> = ({
  title,
  description,
  actions = [],
  additionalContent,
  leftComponent,
  hideBackButton = false,
  backAction,
  showNotification = false,
  showHomeButton = false,
}) => {
  return (
    <View
      style={{
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}>
      <LinearGradient
        colors={[Colors.teal600, Colors.indigo600]}
        className="p-4 pb-6 shadow-lg"
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          padding: 16,
          paddingBottom: 24,
          overflow: 'hidden',
        }}>
        <View className="flex-row items-center gap-3">
          {/* Back button slot */}
          {!hideBackButton ? (
            leftComponent ? (
              leftComponent
            ) : (
              <AnimatedPressable
                onPress={backAction}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <ChevronLeft size={20} color="white" />
              </AnimatedPressable>
            )
          ) : (
            ''
          )}

          {/* Title + description */}
          <View className="flex-1">
            <Text className="text-lg text-white">{title}</Text>
            {description && <Text className="text-sm text-teal-100">{description}</Text>}
          </View>

          {/* Actions */}
          <View className="flex-row gap-2">
            {actions.length > 0 &&
              actions.map((action, index) => {
                if (action.component) {
                  return <View key={index}>{action.component}</View>;
                }
                if (action.icon) {
                  const Icon = action.icon;
                  return (
                    <AnimatedPressable
                      key={index}
                      onPress={action.onPress}
                      className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                      <Icon size={20} color="white" />
                    </AnimatedPressable>
                  );
                }
              })}
            {showNotification && <NotificationBell />}
            {showHomeButton && <HomeButton />}
          </View>
        </View>

        {/* Additional Content */}
        {additionalContent && <View className="mt-4 space-y-2">{additionalContent}</View>}
      </LinearGradient>
    </View>
  );
};
