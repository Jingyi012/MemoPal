import { Wifi, WifiOff } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { typography } from '@/theme/typography';

const RECONNECTED_MESSAGE_DURATION = 2_400;

export function NetworkStatusBanner() {
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
      {reconnected ? <Wifi color="#1B6B55" size={18} /> : <WifiOff color="#8D4A1F" size={18} />}
      <View style={styles.copy}>
        <Text style={styles.title}>{reconnected ? 'Back online' : 'You are offline'}</Text>
        <Text style={styles.description}>
          {reconnected ? 'Syncing your latest progress now.' : 'Saved lessons remain available on this device.'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  offline: {
    backgroundColor: '#FFF1E4',
    borderBottomColor: '#F2C79F',
  },
  reconnected: {
    backgroundColor: '#E5F6EF',
    borderBottomColor: '#A9DCC6',
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  title: {
    color: '#2C241F',
    fontFamily: typography.bodyExtraBold,
    fontSize: 13,
  },
  description: {
    color: '#665A51',
    fontFamily: typography.bodySemibold,
    fontSize: 12,
    lineHeight: 17,
  },
});
