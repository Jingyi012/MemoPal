import AnimatedPressable from '@/components/AnimatedPressable';
import { SceneEditorCard } from '@/features/memory-composer/components/SceneEditorCard';
import type { PalaceLocus } from '@/features/palace-scenes/types/palaceScene.types';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type PalaceAssociationEditorProps = {
  items: string[];
  loci: PalaceLocus[];
  associations: string[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onChangeAssociation: (value: string) => void;
};

export function PalaceAssociationEditor({
  items,
  loci,
  associations,
  activeIndex,
  onSelectIndex,
  onChangeAssociation,
}: PalaceAssociationEditorProps) {
  if (!items.length) {
    return null;
  }

  const safeIndex = Math.min(Math.max(activeIndex, 0), items.length - 1);
  const activeItem = items[safeIndex];
  const activeLocus = loci[safeIndex];

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>MAKE IT YOURS</Text>
          <Text style={styles.title}>Add a vivid association</Text>
        </View>
        <Text style={styles.progress}>{safeIndex + 1}/{items.length}</Text>
      </View>
      <Text style={styles.helper}>Tap a marker or item, then describe the strange little scene you want to remember.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {items.map((item, index) => (
          <AnimatedPressable
            key={`${item}-${index}`}
            accessibilityRole="button"
            onPress={() => onSelectIndex(index)}
            style={[styles.chip, index === safeIndex && styles.chipActive]}>
            <Text style={[styles.chipText, index === safeIndex && styles.chipTextActive]}>
              {index + 1}. {item}
            </Text>
          </AnimatedPressable>
        ))}
      </ScrollView>
      <SceneEditorCard
        index={safeIndex}
        total={items.length}
        anchorLabel={`LOCUS ${safeIndex + 1} · ${activeLocus?.name ?? 'NEXT SPOT'}`}
        itemLabel={activeItem}
        visual={<Text style={styles.locationVisual}>📍 {activeLocus?.name ?? 'Next spot'}</Text>}
        value={associations[safeIndex] ?? ''}
        onChangeText={onChangeAssociation}
        placeholder="Make it colourful, surprising, and impossible to ignore…"
        accessibilityLabel={`Association for ${activeItem}`}
        accent="palace"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
  },
  headingRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headingCopy: {
    flex: 1,
  },
  eyebrow: {
    color: theme.violetDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 10,
    letterSpacing: 0.9,
  },
  title: {
    color: theme.ink,
    fontFamily: typography.display,
    fontSize: 15,
    marginTop: 3,
  },
  progress: {
    backgroundColor: '#EEE9FF',
    borderRadius: 999,
    color: theme.violetDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  helper: {
    color: theme.inkSoft,
    fontFamily: typography.bodyBold,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },
  chips: {
    gap: 8,
    paddingVertical: 11,
  },
  chip: {
    backgroundColor: theme.paper,
    borderColor: theme.line,
    borderRadius: 999,
    borderWidth: 1.5,
    overflow: 'hidden',
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  chipText: {
    color: theme.inkSoft,
    fontFamily: typography.bodyBold,
    fontSize: 11,
  },
  chipTextActive: {
    color: theme.ink,
  },
  chipActive: {
    backgroundColor: theme.sun,
    borderColor: theme.sunDeep,
  },
  locationVisual: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 },
});
