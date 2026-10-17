import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import type { PalaceLocus, PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { ChevronLeft, ChevronRight, RotateCcw } from '@/core/icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import { getPalaceLocusName } from '@/features/palace-scenes/utils/palaceLocalization';

type PalaceFocusCardProps = {
  scene: PalaceScene;
  locus: PalaceLocus;
  index: number;
  answer: string;
  association?: string | null;
  showAnswer?: boolean;
  total?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onStartRecall?: () => void;
  isLast?: boolean;
};

export function PalaceFocusCard({
  scene,
  locus,
  index,
  answer,
  association,
  showAnswer = true,
  total,
  onPrevious,
  onNext,
  onStartRecall,
  isLast = false,
}: PalaceFocusCardProps) {
  const { language, t } = useTranslation('palace');
  const localizedLocusName = getPalaceLocusName(locus, language);
  const zoom = 2.15;
  return (
    <View style={styles.card}>
      <View style={styles.focusWindow}>
        <AppImage
          imageUrl={scene.imageUrl}
          imageSource={scene.imageSource}
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
          <Text style={styles.focusPinEmoji}>📍</Text>
        </View>
        <View style={styles.focusBadge}>
          <Text style={styles.focusBadgeText}>{t('locusLabel').toUpperCase()} {index + 1}</Text>
        </View>
      </View>
      <View style={styles.copy}>
        <View style={styles.eyebrowRow}>
          <Text style={styles.focusSparkleEmoji}>✨</Text>
          <Text style={styles.eyebrow}>{localizedLocusName.toUpperCase()}</Text>
        </View>
        {showAnswer ? <Text style={styles.answer}>{answer}</Text> : <Text style={styles.hiddenAnswer}>{t('hiddenMemory')}</Text>}
        {showAnswer && association ? <Text style={styles.association}>{association}</Text> : null}
      </View>
      {onPrevious || onNext ? (
        <View style={styles.navigationRow}>
          <AnimatedPressable
            accessibilityLabel={t('previousLocus')}
            disabled={!onPrevious || index === 0}
            onPress={onPrevious}
            style={[styles.roundButton, (!onPrevious || index === 0) && styles.disabledButton]}>
            <ChevronLeft size={21} color={theme.ink} />
          </AnimatedPressable>
          <Text style={styles.position}>
            {total ? `${index + 1} / ${total}` : `${t('locusLabel')} ${index + 1}`}
          </Text>
          <AnimatedPressable
            accessibilityLabel={isLast ? t('restartWalk') : t('nextLocus')}
            disabled={!onNext}
            onPress={onNext}
            style={styles.roundButton}>
            {isLast ? <RotateCcw size={19} color={theme.ink} /> : <ChevronRight size={21} color={theme.ink} />}
          </AnimatedPressable>
        </View>
      ) : null}
      {onStartRecall ? (
        <AnimatedPressable accessibilityLabel={t('recallChallenge')} onPress={onStartRecall} style={styles.recallButton}>
          <Text style={styles.recallEmoji}>🧠</Text>
          <Text style={styles.recallText}>{t('recallChallenge')}</Text>
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
    height: 52,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -26,
    marginTop: -26,
    position: 'absolute',
    boxShadow: '0px 2px 7px rgba(43, 42, 61, 0.22)',
    top: '50%',
    width: 52,
  },
  focusPinEmoji: { fontSize: 18 },
  focusBadge: {
    backgroundColor: 'rgba(36,31,56,.84)',
    borderRadius: 999,
    left: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: 'absolute',
    top: 12,
  },
  focusBadgeText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.7 },
  copy: { padding: 14 },
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  eyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.7 },
  focusSparkleEmoji: { fontSize: 13 },
  answer: { color: theme.ink, fontFamily: typography.display, fontSize: 22, marginTop: 6 },
  hiddenAnswer: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 6 },
  association: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, marginTop: 7 },
  navigationRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 14, marginBottom: 12 },
  roundButton: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 23, height: 46, justifyContent: 'center', width: 46 },
  disabledButton: { opacity: 0.35 },
  position: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  recallButton: { alignItems: 'center', backgroundColor: '#F7F5FF', borderColor: '#9B8CFF', borderRadius: 13, borderWidth: 2, flexDirection: 'row', gap: 7, justifyContent: 'center', marginHorizontal: 14, marginBottom: 14, minHeight: 45 },
  recallText: { color: '#6654D9', fontFamily: typography.bodyExtraBold, fontSize: 12 },
  recallEmoji: { fontSize: 15 },
});
