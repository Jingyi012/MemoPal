import { AppText as Text } from '@/components/ui/AppText';
import { appLayout, appSpacing, appTextStyles } from '@/theme/designSystem';
import { ChevronLeft, LucideIcon } from '@/core/icons';
import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderIconButton } from './ui/HeaderIconButton';
import HomeButton from './HomeButton';
import { NotificationBell } from './NotificationBell';
import { memopalTheme as theme, memopalThemes } from '@/theme/memopalTheme';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { AiCreditCoinButton } from '@/features/ai-credits/components/AiCreditBalanceLink';

interface Actions {
  icon?: LucideIcon;
  onPress?: () => void;
  component?: ReactNode;
  accessibilityLabel?: string;
}

interface HeaderProps {
  title: string;
  titleAccessory?: ReactNode;
  description?: ReactNode;
  /** @deprecated Kept temporarily for call-site compatibility; page headers no longer render eyebrow labels. */
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
  /** Opt in only where credits support the current action; the wallet is in Me. */
  showAiCredits?: boolean;
  /** Use a shorter header for focused practice sessions. */
  compact?: boolean;
  /** Let the parent screen's background show through the header. */
  backgroundMode?: 'solid' | 'transparent';
}

export const CommonHeader: React.FC<HeaderProps> = ({
  title,
  titleAccessory,
  description = '',
  actions = [],
  additionalContent,
  leftComponent,
  hideBackButton = false,
  backAction,
  showNotification = false,
  showHomeButton = false,
  showAiCredits = false,
  compact = false,
  backgroundMode = 'solid',
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: backgroundMode === 'transparent' ? 'transparent' : activeTheme.canvas,
          borderBottomColor: activeTheme.line,
        },
      ]}>
      <View
        style={[
          styles.headerInner,
          compact && styles.compactHeaderInner,
          { paddingTop: insets.top + (compact ? 4 : 8) },
        ]}>
        <View style={[styles.row, compact && styles.compactRow]}>
          {/* Back button slot */}
          {!hideBackButton ? (
            leftComponent ? (
              leftComponent
            ) : (
              <HeaderIconButton
                icon={ChevronLeft}
                accessibilityLabel="Go back"
                onPress={backAction ?? (() => router.back())}
              />
            )
          ) : (
            null
          )}

          {/* Title + description */}
          <View style={styles.titleBlock}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: appSpacing.xs }}>
            <Text accessibilityRole="header"
              style={[styles.title, hideBackButton ? appTextStyles.pageTitle : appTextStyles.screenTitle, compact && appTextStyles.compactTitle, { color: activeTheme.ink }]}
              numberOfLines={1}>
              {title}
            </Text>
            {titleAccessory}</View>
            {!!description && (
              <Text
                style={[
                  styles.description,
                  compact && styles.compactDescription,
                  { color: activeTheme.inkSoft },
                ]}
                numberOfLines={compact ? 1 : 2}>
                {description}
              </Text>
            )}
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
                    <HeaderIconButton
                      icon={Icon}
                      accessibilityLabel={action.accessibilityLabel ?? title}
                      key={index}
                      onPress={action.onPress}
                    />
                  );
                }
              })}
            {showNotification && <NotificationBell />}
            {showHomeButton && <HomeButton />}
            {showAiCredits && <AiCreditCoinButton />}
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
    borderBottomWidth: 0,
    borderBottomColor: theme.line,
  },
  headerInner: {
    paddingHorizontal: appLayout.pagePadding,
    paddingBottom: appSpacing.md,
  },
  compactHeaderInner: {
    paddingHorizontal: appLayout.pagePadding,
    paddingBottom: appSpacing.sm,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    minHeight: appLayout.touchTarget,
  },
  compactRow: {
    gap: appSpacing.sm,
    minHeight: appLayout.touchTarget,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: theme.ink,
    ...appTextStyles.pageTitle,
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  compactTitle: { letterSpacing: -0.1 },
  description: {
    color: theme.inkSoft,
    ...appTextStyles.label,
    marginTop: 2,
  },
  compactDescription: {
    ...appTextStyles.label,
    marginTop: 0,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: appSpacing.xs,
  },
  additionalContent: {
    marginTop: 10,
  },
};
