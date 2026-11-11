import { AppText as Text } from '@/components/ui/AppText';
import { appSpacing, appTextStyles } from '@/theme/designSystem';
import { Wifi, WifiOff } from '@/core/icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useTranslation } from '@/core/i18n/useTranslation';
import { typography } from '@/theme/typography';
import { createThemedStyles } from '@/theme/createThemedStyles';

const RECONNECTED_MESSAGE_DURATION = 2_400;

export function NetworkStatusBanner() {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('network');
  const { isOnline, isReady } = useNetworkStatus();
  const wasOffline = useRef(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isOnline) {
      wasOffline.current = true;
      setShowReconnected(false);
      return;
    }

    if (!wasOffline.current) {
      return;
    }

    setShowReconnected(true);
    wasOffline.current = false;
  }, [isOnline, isReady]);

  useEffect(() => {
    if (!showReconnected) {
      return;
    }

    const timeout = setTimeout(() => setShowReconnected(false), RECONNECTED_MESSAGE_DURATION);
    return () => clearTimeout(timeout);
  }, [showReconnected]);

  const isVisible = isReady && (!isOnline || showReconnected);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isVisible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isVisible, opacity]);

  if (!isVisible) {
    return null;
  }

  const reconnected = isOnline && showReconnected;
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.banner, reconnected ? styles.reconnected : styles.offline, { opacity }]}>
      {reconnected ? <Wifi color={theme.successText} size={18} /> : <WifiOff color={theme.inkSoft} size={18} />}
      <View style={styles.copy}>
        <Text style={styles.title}>{reconnected ? t('backOnline') : t('offline')}</Text>
        <Text style={styles.description}>
          {reconnected ? t('syncing') : t('offlineDescription')}
        </Text>
      </View>
    </Animated.View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  banner: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: appSpacing.xl,
    paddingVertical: 10,
  },
  offline: {
    backgroundColor: theme.peachTint,
    borderBottomColor: theme.peachLine,
  },
  reconnected: {
    backgroundColor: theme.mintTint,
    borderBottomColor: theme.mintLine,
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  title: {
    color: theme.ink,
    fontFamily: typography.bodyExtraBold,
    fontSize: appTextStyles.small.fontSize,
  },
  description: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: appTextStyles.caption.fontSize,
    lineHeight: appTextStyles.caption.lineHeight,
  },
}));
