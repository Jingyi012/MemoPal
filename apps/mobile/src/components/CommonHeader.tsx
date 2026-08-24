import { ChevronLeft, LucideIcon } from 'lucide-react-native';
import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedPressable from './AnimatedPressable';
import HomeButton from './HomeButton';
import { NotificationBell } from './NotificationBell';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';

interface Actions {
  icon?: LucideIcon;
  onPress?: () => void;
  component?: ReactNode;
  accessibilityLabel?: string;
}

interface HeaderProps {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
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
  description = '',
  eyebrow,
  actions = [],
  additionalContent,
  leftComponent,
  hideBackButton = false,
  backAction,
  showNotification = false,
  showHomeButton = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.header}>
      <View style={[styles.headerInner, { paddingTop: insets.top + 8 }]}>
        <View style={styles.row}>
          {/* Back button slot */}
          {!hideBackButton ? (
            leftComponent ? (
              leftComponent
            ) : (
              <AnimatedPressable
                accessibilityLabel="Go back"
                hitSlop={4}
                onPress={backAction}
                style={styles.backButton}>
                <ChevronLeft size={20} color={theme.ink} />
              </AnimatedPressable>
            )
          ) : (
            ''
          )}

          {/* Title + description */}
          <View style={styles.titleBlock}>
            {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
            <Text style={styles.title}>{title}</Text>
            {description && <Text style={styles.description}>{description}</Text>}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {actions.length > 0 &&
              actions.map((action, index) => {
                if (action.component) {
                  return <View key={index}>{action.component}</View>;
                }
                if (action.icon) {
                  const Icon = action.icon;
                  return (
                    <AnimatedPressable
                      accessibilityLabel={action.accessibilityLabel}
                      hitSlop={4}
                      key={index}
                      onPress={action.onPress}
                      style={styles.actionButton}>
                      <Icon size={20} color={theme.ink} />
                    </AnimatedPressable>
                  );
                }
              })}
            {showNotification && <NotificationBell />}
            {showHomeButton && <HomeButton />}
          </View>
        </View>

        {/* Additional Content */}
        {additionalContent && <View style={styles.additionalContent}>{additionalContent}</View>}
      </View>
    </View>
  );
};

const styles = {
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  headerInner: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    minHeight: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 19,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.sand,
  },
  titleBlock: {
    flex: 1,
  },
  eyebrow: {
    alignSelf: 'flex-start' as const,
    color: theme.berryDeep,
    backgroundColor: theme.berryTint,
    borderWidth: 1.3,
    borderColor: theme.berryLine,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    fontSize: 10,
    fontFamily: typography.display,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  title: {
    color: theme.ink,
    fontSize: 19,
    fontFamily: typography.displayExtraBold,
    letterSpacing: -0.2,
  },
  description: {
    color: theme.inkSoft,
    fontSize: 11.5,
    fontFamily: typography.bodyBold,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 7,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 19,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.sand,
  },
  additionalContent: {
    marginTop: 10,
  },
};
