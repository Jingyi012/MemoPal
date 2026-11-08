import { useCallback, useEffect, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { createLearningStyles, learningTypography as typography } from '../theme/learningTheme';
import { useLearningCopy } from './LearningUi';

const width = 104;
const gap = 8;
export function LearningStudyNavigator({ items, index, onSelect }: {
  items: readonly { id: string; primary: string }[]; index: number; onSelect: (index: number) => void;
}) {
  const { styles: s } = useStyles(); const { zh } = useLearningCopy(); const list = useRef<FlatList>(null);
  const revealCurrent = useCallback(() => {
    if (!items.length) return;
    if (index === 0) list.current?.scrollToOffset({ offset: 0, animated: false });
    else list.current?.scrollToIndex({ index, animated: false, viewPosition: .5 });
  }, [index, items.length]);
  useEffect(revealCurrent, [revealCurrent]);
  return <View style={{ gap: 8 }}>
    <View style={s.row}><Text style={s.heading}>{zh ? '本单元卡片' : 'Cards in this unit'}</Text><Text style={s.hint}>{zh ? '点击切换' : 'Tap to switch'}</Text></View>
    <FlatList ref={list} horizontal data={items} keyExtractor={item => item.id} showsHorizontalScrollIndicator={false} onLayout={revealCurrent}
      getItemLayout={(_, position) => ({ length: width, offset: position * (width + gap), index: position })}
      ItemSeparatorComponent={() => <View style={{ width: gap }} />}
      renderItem={({ item, index: position }) => <AnimatedPressable accessibilityRole="button" accessibilityState={{ selected: position === index }}
        accessibilityLabel={`${position + 1}. ${item.primary}`} onPress={() => onSelect(position)} style={[s.card, position === index && s.selected]}>
        <Text style={[s.number, position === index && s.activeText]}>{String(position + 1).padStart(2, '0')}</Text>
        <Text numberOfLines={1} style={[s.word, position === index && s.activeText]}>{item.primary}</Text>
      </AnimatedPressable>} />
  </View>;
}
const useStyles = createLearningStyles(t => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  heading: { color: t.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  hint: { color: t.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12 },
  card: { width, minHeight: 68, borderRadius: 16, borderWidth: 1.5, borderBottomWidth: 3, borderColor: t.line, backgroundColor: t.paper, padding: 10, gap: 4 },
  selected: { borderColor: t.violetDeep, backgroundColor: t.violetTint },
  number: { color: t.inkSoft, fontFamily: typography.bodyBold, fontSize: 11 },
  word: { color: t.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  activeText: { color: t.violetDeep },
}));
