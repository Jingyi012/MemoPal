import AnimatedPressable from '@/components/AnimatedPressable';
import type { PalaceLocus } from '@/features/palace-scenes/types/palaceScene.types';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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
      <View style={styles.editorCard}>
        <Text style={styles.location}>Locus {safeIndex + 1} · {activeLocus?.name ?? 'next spot'}</Text>
        <Text style={styles.prompt}>What happens here?</Text>
        <TextInput
          accessibilityLabel={`Association for ${activeItem}`}
          multiline
          onChangeText={onChangeAssociation}
          placeholder="Make it colourful, surprising, and impossible to ignore…"
          placeholderTextColor="#AAA7B5"
          style={styles.input}
          textAlignVertical="top"
          value={associations[safeIndex] ?? ''}
        />
      </View>
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
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  title: {
    color: theme.ink,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 3,
  },
  progress: {
    backgroundColor: '#EEE9FF',
    borderRadius: 999,
    color: theme.violetDeep,
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  helper: {
    color: theme.inkSoft,
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 11,
    fontWeight: '800',
  },
  chipTextActive: {
    color: theme.ink,
  },
  chipActive: {
    backgroundColor: theme.sun,
    borderColor: theme.sunDeep,
  },
  editorCard: {
    backgroundColor: theme.paper,
    borderColor: theme.line,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 13,
  },
  location: {
    color: theme.violetDeep,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  prompt: {
    color: theme.ink,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#FFFDF8',
    borderColor: theme.line,
    borderRadius: 13,
    borderWidth: 1.5,
    color: theme.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 9,
    minHeight: 82,
    padding: 12,
  },
});
