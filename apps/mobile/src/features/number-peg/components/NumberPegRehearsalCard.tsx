import AnimatedPressable from '@/components/AnimatedPressable';
import type { MemoryItem, PegBinding } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import type { NumberPegItem } from '@/features/number-peg/types/numberPeg.types';
import { typography } from '@/theme/typography';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

type NumberPegRehearsalCardProps = {
  item: MemoryItem;
  peg: NumberPegItem;
  binding?: PegBinding;
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function NumberPegRehearsalCard({
  item,
  peg,
  binding,
  index,
  total,
  onPrevious,
  onNext,
}: NumberPegRehearsalCardProps) {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.icon}><Text style={styles.iconEmoji}>🎬</Text></View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>PEG {peg.number} · {peg.keyword.toUpperCase()}</Text>
          <Text style={styles.progress}>{index + 1} of {total}</Text>
        </View>
      </View>
      <View style={styles.sceneVisual}>
        <View style={styles.pegBubble}><Text style={styles.pegEmoji}>{peg.image}</Text><Text style={styles.pegNumber}>{peg.number}</Text></View>
        <Text style={styles.sceneSparkle}>✨</Text>
        <Text numberOfLines={3} style={styles.answer}>{item.answer}</Text>
      </View>
      <Text style={styles.prompt}>Pause and play the scene in your head.</Text>
      <Text style={styles.sceneText}>{binding?.sceneText ?? `Picture ${item.answer} interacting with this peg.`}</Text>
      <View style={styles.wordTag}><Text style={styles.wordTagText}>{item.answer}</Text></View>
      <View style={styles.actions}>
        <AnimatedPressable accessibilityLabel="Previous peg" disabled={isFirst} onPress={onPrevious} style={[styles.roundButton, isFirst && styles.disabled]}>
          <ArrowLeft size={19} color={theme.ink} />
        </AnimatedPressable>
        <View style={styles.nextButtonWrap}>
          <AnimatedPressable onPress={onNext} style={styles.nextButton}>
            <Text style={styles.nextText}>{isLast ? 'Start recall' : 'Next peg'}</Text>
            <ArrowRight size={17} color={theme.ink} />
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 20, borderWidth: 2, padding: 16, boxShadow: '0px 7px 0px rgba(43,42,61,0.08)' },
  headerRow: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  icon: { alignItems: 'center', backgroundColor: '#FFF0F4', borderRadius: 13, height: 38, justifyContent: 'center', width: 38 },
  iconEmoji: { fontSize: 20 },
  headerCopy: { flex: 1 },
  eyebrow: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.8 },
  progress: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, marginTop: 3 },
  sceneVisual: { alignItems: 'center', backgroundColor: '#FFFCF4', borderColor: '#EADFC4', borderRadius: 14, borderStyle: 'dashed', borderWidth: 1.5, flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 16, minHeight: 114, padding: 12 },
  pegBubble: { alignItems: 'center', backgroundColor: '#FFF0F4', borderColor: '#FFD9E2', borderRadius: 40, borderWidth: 2, height: 80, justifyContent: 'center', width: 80 },
  pegEmoji: { fontSize: 32 },
  pegNumber: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, marginTop: 2 },
  answer: { color: theme.ink, flexShrink: 1, fontFamily: typography.display, fontSize: 18, maxWidth: 145, textAlign: 'center' },
  prompt: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12, marginTop: 16, textAlign: 'center' },
  sceneText: { color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 14, lineHeight: 21, marginTop: 8, textAlign: 'center' },
  sceneSparkle: { fontSize: 20 },
  wordTag: { alignSelf: 'center', backgroundColor: '#E3F6ED', borderColor: '#BFE7D6', borderRadius: 8, borderWidth: 1, marginTop: 10, paddingHorizontal: 9, paddingVertical: 3 },
  wordTagText: { color: '#247B67', fontFamily: typography.bodyExtraBold, fontSize: 11 },
  actions: { alignItems: 'center', flexDirection: 'row', gap: 9, marginTop: 18, width: '100%' },
  roundButton: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 23, height: 46, justifyContent: 'center', width: 46 },
  disabled: { opacity: 0.3 },
  nextButtonWrap: { flex: 1, minWidth: 0 },
  nextButton: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 14, flex: 1, flexDirection: 'row', gap: 7, height: 46, justifyContent: 'center' },
  nextText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
});
