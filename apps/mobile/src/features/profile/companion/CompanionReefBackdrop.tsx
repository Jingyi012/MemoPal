import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

/** The open center keeps Momo legible while the reef frames the tank edges. */
export function CompanionReefBackdrop() {
  return <View pointerEvents="none" style={StyleSheet.absoluteFillObject}
    accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Image source={require('../../../../assets/images/momo-reef-background.png')}
      resizeMode="cover" style={styles.backdropImage} />
  </View>;
}

type Bubble = {
  id: number;
  left: number;
  bottom: number;
  size: number;
  delay: number;
  drift: number;
  wobble: number;
  rise: number;
  duration: number;
};

/** Small, irregular groups rise from either side instead of repeating one fixed pattern. */
export function CompanionReefBubbles({ active, light = false, maxCount = 20 }: {
  active: boolean; light?: boolean; maxCount?: number;
}) {
  const reduceMotion = useReducedMotion();
  const nextId = useRef(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    if (!active || reduceMotion) {
      setBubbles([]);
      return;
    }
    let spawnTimer: ReturnType<typeof setTimeout>;
    const removalTimers = new Set<ReturnType<typeof setTimeout>>();

    const spawn = () => {
      const fromLeft = Math.random() < .5;
      const origin = fromLeft ? 12 + Math.random() * 15 : 73 + Math.random() * 15;
      const bottom = 7 + Math.random() * 19;
      const count = 3 + Math.floor(Math.random() * 3);
      const group: Bubble[] = Array.from({ length: count }, (_, index) => ({
        id: nextId.current++,
        left: Math.max(6, Math.min(92, origin + (Math.random() - .5) * 9)),
        bottom: bottom + (Math.random() - .5) * 5,
        size: Math.round(5 + Math.random() * 14),
        delay: index * 95 + Math.random() * 110,
        drift: (fromLeft ? 10 : -10) + (Math.random() - .5) * 30,
        wobble: 6 + Math.random() * 10,
        rise: 135 + Math.random() * 115,
        duration: 3100 + Math.random() * 1600,
      }));
      // Leave room for three foreground objects and transient feedback below the 30-particle cap.
      setBubbles((current) => [...current, ...group].slice(-maxCount));
      const ids = new Set(group.map((bubble) => bubble.id));
      const removal = setTimeout(() => {
        setBubbles((current) => current.filter((bubble) => !ids.has(bubble.id)));
        removalTimers.delete(removal);
      }, Math.max(...group.map((bubble) => bubble.delay + bubble.duration)) + 100);
      removalTimers.add(removal);
      spawnTimer = setTimeout(spawn, 1400 + Math.random() * 1900);
    };

    spawnTimer = setTimeout(spawn, 350);
    return () => {
      clearTimeout(spawnTimer);
      removalTimers.forEach(clearTimeout);
    };
  }, [active, reduceMotion, maxCount]);

  return <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {reduceMotion ? <>
      <View style={[styles.bubble, light && styles.bubbleLight, styles.restBubbleLeft]} />
      <View style={[styles.bubble, light && styles.bubbleLight, styles.restBubbleRight]} />
    </> : bubbles.map((bubble) => <RisingBubble key={bubble.id} bubble={bubble} light={light} />)}
  </View>;
}

function RisingBubble({ bubble, light }: {
  bubble: Bubble;
  light: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(bubble.delay),
      Animated.timing(progress, { toValue: 1, duration: bubble.duration, easing: Easing.linear, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [bubble.delay, bubble.duration, progress]);
  return <Animated.View style={[
    styles.bubble,
    light && styles.bubbleLight,
    { left: `${bubble.left}%`, bottom: `${bubble.bottom}%`, width: bubble.size, height: bubble.size, borderRadius: bubble.size / 2 },
    {
      opacity: progress.interpolate({ inputRange: [0, .12, .7, 1], outputRange: [0, .86, .68, 0] }),
      transform: [
        { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -bubble.rise] }) },
        { translateX: progress.interpolate({ inputRange: [0, .28, .58, .82, 1], outputRange: [0, bubble.wobble, bubble.drift * .5 - bubble.wobble, bubble.drift + bubble.wobble * .4, bubble.drift] }) },
        { scale: progress.interpolate({ inputRange: [0, .45, 1], outputRange: [.85, 1, 1.1] }) },
      ],
    },
  ]}>{bubble.size >= 9 ? <View style={styles.bubbleGlint} /> : null}</Animated.View>;
}

const styles = StyleSheet.create({
  backdropImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bubble: { position: 'absolute', borderWidth: 1.5, borderColor: '#F2FDFF', backgroundColor: '#DDF6FF88' },
  bubbleGlint: { position: 'absolute', top: 2, left: 3, width: 3, height: 3, borderRadius: 2, backgroundColor: '#FFFFFF' },
  bubbleLight: { borderColor: '#9482D4', backgroundColor: '#FFFFFFB3' },
  restBubbleLeft: { left: '23%', bottom: '43%', width: 14, height: 14, borderRadius: 7, opacity: .5 },
  restBubbleRight: { right: '19%', bottom: '57%', width: 9, height: 9, borderRadius: 5, opacity: .5 },
});
