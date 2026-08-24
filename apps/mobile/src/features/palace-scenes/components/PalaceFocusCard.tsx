import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import type { PalaceLocus, PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

type PalaceFocusCardProps = {
  scene: PalaceScene;
  locus: PalaceLocus;
  index: number;
  answer: string;
  association?: string | null;
  showAnswer?: boolean;
  onNext?: () => void;
  isLast?: boolean;
};

export function PalaceFocusCard({
  scene,
  locus,
  index,
  answer,
  association,
  showAnswer = true,
  onNext,
  isLast = false,
}: PalaceFocusCardProps) {
  const zoom = 2.15;
  return (
    <View style={styles.card}>
      <View style={styles.focusWindow}>
        <AppImage
          imageUrl={scene.imageUrl}
          style={[
            styles.focusImage,
            {
              height: `${zoom * 100}%`,
              left: `${50 - zoom * locus.xPercent}%`,
              top: `${50 - zoom * locus.yPercent}%`,
              width: `${zoom * 100}%`,
            },
          ]}
          transition={250}
        />
        <View style={styles.focusRing}>
          <MapPin size={18} color={theme.ink} />
        </View>
        <View style={styles.focusBadge}>
          <Text style={styles.focusBadgeText}>LOCUS {index + 1}</Text>
        </View>
      </View>
      <View style={styles.copy}>
        <View style={styles.eyebrowRow}>
          <Sparkles size={14} color={theme.violetDeep} />
          <Text style={styles.eyebrow}>{locus.name.toUpperCase()}</Text>
        </View>
        {showAnswer ? <Text style={styles.answer}>{answer}</Text> : <Text style={styles.hiddenAnswer}>What memory belongs here?</Text>}
        {showAnswer && association ? <Text style={styles.association}>{association}</Text> : null}
      </View>
      {onNext ? (
        <AnimatedPressable onPress={onNext} style={styles.nextButton}>
          <Text style={styles.nextText}>{isLast ? 'Restart the walk' : 'Next locus'}</Text>
          <ArrowRight size={17} color={theme.ink} />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.paper,
    borderColor: '#DCD4FF',
    borderRadius: 22,
    borderWidth: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  focusWindow: {
    backgroundColor: '#EEE9FF',
    height: 190,
    overflow: 'hidden',
    position: 'relative',
  },
  focusImage: {
    position: 'absolute',
  },
  focusRing: {
    alignItems: 'center',
    backgroundColor: theme.sun,
    borderColor: 'white',
    borderRadius: 26,
    borderWidth: 4,
    elevation: 5,
    height: 52,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -26,
    marginTop: -26,
    position: 'absolute',
    shadowColor: theme.ink,
    shadowOpacity: 0.22,
    shadowRadius: 7,
    top: '50%',
    width: 52,
  },
  focusBadge: {
    backgroundColor: 'rgba(36,31,56,.84)',
    borderRadius: 999,
    left: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: 'absolute',
    top: 12,
  },
  focusBadgeText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  copy: { padding: 14 },
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  eyebrow: { color: theme.violetDeep, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  answer: { color: theme.ink, fontSize: 22, fontWeight: '900', marginTop: 6 },
  hiddenAnswer: { color: theme.inkSoft, fontSize: 13, fontWeight: '800', marginTop: 6 },
  association: { color: theme.inkSoft, fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: 7 },
  nextButton: { alignItems: 'center', backgroundColor: theme.sun, flexDirection: 'row', gap: 7, justifyContent: 'center', marginHorizontal: 14, marginBottom: 14, minHeight: 45, borderRadius: 13 },
  nextText: { color: theme.ink, fontSize: 12, fontWeight: '900' },
});
