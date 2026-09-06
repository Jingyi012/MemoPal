import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { memopalTheme as theme, memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type PreferenceSelectionOption = {
  key: string;
  emoji: string;
  title: string;
  description: string;
  tint: string;
};

type PreferenceSelectionSheetProps = {
  title: string;
  description: string;
  currentValue: string;
  options: PreferenceSelectionOption[];
  onSelect: (value: string) => void | Promise<void>;
};

/** Shared appearance for short settings pickers such as language and theme. */
export const PreferenceSelectionSheet = forwardRef<BottomSheetModal, PreferenceSelectionSheetProps>(
  ({ title, description, currentValue, options, onSelect }, ref) => (
    <PreferenceSheetContent
      ref={ref}
      title={title}
      description={description}
      currentValue={currentValue}
      options={options}
      onSelect={onSelect}
    />
  )
);

const PreferenceSheetContent = forwardRef<BottomSheetModal, PreferenceSelectionSheetProps>(
  ({ title, description, currentValue, options, onSelect }, ref) => {
    const { colorScheme } = useColorScheme();
    const activeTheme = memopalThemes[colorScheme ?? 'light'];

    return <CustomBottomSheetModal ref={ref} snapPoints={['58%']} enableDynamicSizing={false}>
      <BottomSheetScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: activeTheme.ink }]}>{title}</Text>
        <Text style={[styles.description, { color: activeTheme.inkSoft }]}>{description}</Text>

        <View style={styles.options}>
          {options.map((option) => {
            const selected = currentValue === option.key;
            return (
              <AnimatedPressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={option.key}
                onPress={() => void onSelect(option.key)}
                style={[styles.option, { borderColor: activeTheme.line, backgroundColor: activeTheme.paper }, selected && { borderColor: activeTheme.violet, backgroundColor: activeTheme.violetTint }]}>
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: selected ? activeTheme.paper : option.tint },
                  ]}>
                  <Text style={styles.emoji}>{option.emoji}</Text>
                </View>
                <View style={styles.copy}>
                  <Text style={[styles.optionTitle, { color: activeTheme.ink }]}>{option.title}</Text>
                  <Text style={[styles.optionBody, { color: activeTheme.inkSoft }]}>{option.description}</Text>
                </View>
                <View style={[styles.radio, { borderColor: activeTheme.line }, selected && { borderColor: activeTheme.violetDeep, backgroundColor: activeTheme.violetDeep }]}>
                  {selected ? <Text style={[styles.check, { color: activeTheme.paper }]}>✓</Text> : null}
                </View>
              </AnimatedPressable>
            );
          })}
        </View>
      </BottomSheetScrollView>
    </CustomBottomSheetModal>;
  }
);

PreferenceSheetContent.displayName = 'PreferenceSheetContent';

PreferenceSelectionSheet.displayName = 'PreferenceSelectionSheet';

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 20 },
  description: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, marginTop: 4 },
  options: { gap: 10, marginTop: 17 },
  option: { minHeight: 72, borderRadius: 18, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  optionSelected: { borderColor: theme.violet, backgroundColor: theme.violetTint },
  icon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22 },
  copy: { flex: 1, minWidth: 0 },
  optionTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13.5 },
  optionBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  radio: { width: 23, height: 23, borderRadius: 12, borderWidth: 2, borderColor: theme.line, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: theme.violetDeep, backgroundColor: theme.violetDeep },
  check: { color: theme.paper, fontFamily: typography.bodyExtraBold, fontSize: 12, lineHeight: 15 },
});
