import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Check, ChevronRight } from '@/core/icons';
import { StyleSheet, View } from 'react-native';

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
  const { styles, theme } = useStyles();
  const { t } = useTranslation('palace');

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}><Text style={styles.headingEmoji}>📋</Text></View>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>{t('palaceDirectory')}</Text>
          <Text style={styles.title}>{t('palaceInOrder')}</Text>
        </View>
      </View>
      <Text style={styles.helper}>{t('palaceDirectoryHelper')}</Text>
      <View style={styles.list}>
        {items.map((item, index) => {
          const active = index === activeIndex;
          return (
            <AnimatedPressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={t('orderedLocusAccessibility')
                .replace('{number}', String(index + 1))
                .replace('{name}', item.locusName ?? t('memorySpot'))
                .replace('{answer}', item.answer)}
              onPress={() => onSelect(index)}
              style={[styles.row, active && styles.rowActive]}>
              <View style={[styles.number, active && styles.numberActive]}>
                {active ? <Check size={14} color={theme.onSun} /> : <Text style={styles.numberText}>{index + 1}</Text>}
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.locus}>
                  {item.locusName ?? `${t('locusLabel')} ${index + 1}`}
                </Text>
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

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  section: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.card, borderWidth: 1, padding: 14 },
  headingRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  headingIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: appRadii.control, height: 38, justifyContent: 'center', width: 38 },
  headingEmoji: { fontSize: appArtworkSizes.tiny },
  headingCopy: { flex: 1 },
  eyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, letterSpacing: 0.8 },
  title: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.cardTitle.fontSize, marginTop: 2 },
  helper: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, marginTop: 9 },
  list: { gap: appSpacing.sm, marginTop: appSpacing.md },
  row: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.control, borderWidth: 1.5, flexDirection: 'row', gap: 10, minHeight: 68, paddingHorizontal: 10, paddingVertical: 9 },
  rowActive: { backgroundColor: theme.violetTint, borderColor: theme.violetDeep },
  number: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: appRadii.control, height: 30, justifyContent: 'center', width: 30 },
  numberActive: { backgroundColor: theme.sun },
  numberText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  rowCopy: { flex: 1 },
  locus: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, letterSpacing: 0.6, textTransform: 'uppercase' },
  answer: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize, marginTop: 3 },
  association: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, marginTop: 2 },
}));
