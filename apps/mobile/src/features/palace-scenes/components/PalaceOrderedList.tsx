import AnimatedPressable from '@/components/AnimatedPressable';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { Check, ChevronRight, List } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

export type PalaceOrderedItem = {
  id: string;
  answer: string;
  locusName?: string;
  association?: string | null;
};

type PalaceOrderedListProps = {
  items: PalaceOrderedItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function PalaceOrderedList({ items, activeIndex, onSelect }: PalaceOrderedListProps) {
  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}><List size={18} color={theme.violetDeep} /></View>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>ACCESSIBLE ROUTE</Text>
          <Text style={styles.title}>Your Palace in order</Text>
        </View>
      </View>
      <Text style={styles.helper}>Every locus has a named, numbered alternative to the image map.</Text>
      <View style={styles.list}>
        {items.map((item, index) => {
          const active = index === activeIndex;
          return (
            <AnimatedPressable
              key={item.id}
              accessibilityLabel={`Locus ${index + 1}, ${item.locusName ?? 'memory spot'}: ${item.answer}`}
              onPress={() => onSelect(index)}
              style={[styles.row, active && styles.rowActive]}>
              <View style={[styles.number, active && styles.numberActive]}>
                {active ? <Check size={14} color={theme.ink} /> : <Text style={styles.numberText}>{index + 1}</Text>}
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.locus}>{item.locusName ?? `Locus ${index + 1}`}</Text>
                <Text style={styles.answer} numberOfLines={2}>{item.answer}</Text>
                {item.association ? <Text style={styles.association} numberOfLines={2}>{item.association}</Text> : null}
              </View>
              <ChevronRight size={17} color={active ? theme.violetDeep : theme.inkSoft} />
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 20, borderWidth: 2, padding: 14 },
  headingRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  headingIcon: { alignItems: 'center', backgroundColor: '#EEE9FF', borderRadius: 13, height: 38, justifyContent: 'center', width: 38 },
  headingCopy: { flex: 1 },
  eyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.8 },
  title: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 16, marginTop: 2 },
  helper: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 17, marginTop: 9 },
  list: { gap: 8, marginTop: 12 },
  row: { alignItems: 'center', backgroundColor: '#FFFDF8', borderColor: theme.line, borderRadius: 15, borderWidth: 1.5, flexDirection: 'row', gap: 10, minHeight: 68, paddingHorizontal: 10, paddingVertical: 9 },
  rowActive: { backgroundColor: '#F7F5FF', borderColor: '#9B8CFF' },
  number: { alignItems: 'center', backgroundColor: '#EEE9FF', borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  numberActive: { backgroundColor: theme.sun },
  numberText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  rowCopy: { flex: 1 },
  locus: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase' },
  answer: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, marginTop: 3 },
  association: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10.5, lineHeight: 15, marginTop: 2 },
});
