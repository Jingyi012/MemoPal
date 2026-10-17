import { ChevronLeft, LucideIcon } from '@/core/icons';
import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderIconButton } from './ui/HeaderIconButton';
import HomeButton from './HomeButton';
import { NotificationBell } from './NotificationBell';
import { memopalTheme as theme, memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
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
  /** Show the compact AI credit wallet affordance in the header. */
  showAiCredits?: boolean;
  /** Use a shorter header for focused practice sessions. */
  compact?: boolean;
  /** Let the parent screen's background show through the header. */
  backgroundMode?: 'solid' | 'transparent';
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
  showAiCredits = true,
  compact = false,
  backgroundMode = 'solid',
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];

  return (
    <View style={[styles.header, { backgroundColor: backgroundMode === 'transparent' ? 'transparent' : activeTheme.canvas, borderBottomColor: activeTheme.line }]}>
      <View style={[styles.headerInner, compact && styles.compactHeaderInner, { paddingTop: insets.top + (compact ? 4 : 8) }]}>
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
            ''
          )}

          {/* Title + description */}
          <View style={styles.titleBlock}>
            {eyebrow && <Text style={[styles.eyebrow, compact && styles.compactEyebrow, { color: activeTheme.violetDeep, backgroundColor: activeTheme.violetTint, borderColor: activeTheme.violetLine }]}>{eyebrow}</Text>}
            <Text style={[styles.title, compact && styles.compactTitle, { color: activeTheme.ink }]} numberOfLines={compact ? 1 : 2}>{title}</Text>
            {description && <Text style={[styles.description, compact && styles.compactDescription, { color: activeTheme.inkSoft }]} numberOfLines={compact ? 1 : 2}>{description}</Text>}
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  compactHeaderInner: {
    paddingHorizontal: 14,
    paddingBottom: 7,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    minHeight: 44,
  },
  compactRow: {
    gap: 8,
    minHeight: 36,
  },
  titleBlock: {
    flex: 1,
  },
  eyebrow: {
    alignSelf: 'flex-start' as const,
    color: theme.violetDeep,
    backgroundColor: theme.violetTint,
    borderWidth: 1.3,
    borderColor: theme.violetLine,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    fontSize: 10,
    fontFamily: typography.display,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  compactEyebrow: {
    fontSize: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 2,
  },
  title: {
    color: theme.ink,
    fontSize: 25,
    fontFamily: typography.displayExtraBold,
    letterSpacing: -0.2,
  },
  compactTitle: {
    fontSize: 16,
    letterSpacing: -0.1,
  },
  description: {
    color: theme.inkSoft,
    fontSize: 13,
    fontFamily: typography.bodyBold,
    marginTop: 2,
  },
  compactDescription: {
    fontSize: 10,
    marginTop: 0,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 7,
  },
  additionalContent: {
    marginTop: 10,
  },
};
