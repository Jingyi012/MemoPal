import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { typography } from '@/theme/typography';

interface Props {
  total: number;
  current: number;
  label?: string;
  activeColor?: string;
  inactiveColor?: string;
}

export const SegmentedProgressBar: React.FC<Props> = ({ total, current, label }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (current + 1) / total,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [current, progressAnim, total]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        {/* Animated Fill Layer */}
        <Animated.View
          style={[
            styles.fill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />

        {/* Transparent Dividers to create "Segments" */}
        <View style={styles.dividerOverlay}>
          {Array.from({ length: total - 1 }).map((_, i) => (
            <View key={i} style={styles.divider} />
          ))}
        </View>
      </View>

      <View style={styles.labelRow}>
        <Text style={styles.stepCount}>
          STEP {current + 1} OF {total}
        </Text>
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { width: '100%', marginTop: 8 },
  track: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  dividerOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  divider: {
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)', // This "cuts" the bar into segments
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    alignItems: 'center',
  },
  stepCount: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: typography.bodyExtraBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  labelText: {
    color: 'white',
    fontFamily: typography.bodySemibold,
    fontSize: 14,
  },
});
