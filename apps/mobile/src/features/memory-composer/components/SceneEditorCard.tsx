import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';

type SceneEditorCardProps = {
  index: number;
  total: number;
  anchorLabel: string;
  itemLabel?: string;
  visual?: ReactNode;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  maxLength?: number;
  accessibilityLabel: string;
  actionLabel?: string;
  onAction?: () => void;
  accent?: 'peg' | 'palace';
};

/** The shared scene-writing surface used by both memory techniques. */
export function SceneEditorCard({
  index,
  total,
  anchorLabel,
  itemLabel,
  visual,
  value,
  onChangeText,
  placeholder,
  maxLength,
  accessibilityLabel,
  actionLabel,
  onAction,
  accent = 'peg',
}: SceneEditorCardProps) {
  const { t } = useTranslation('memoryComposer');
  const isPalace = accent === 'palace';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.badge, isPalace ? styles.palaceBadge : styles.pegBadge]}>
          <Text style={styles.badgeText}>{index + 1}</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.anchor, isPalace ? styles.palaceText : styles.pegText]}>{anchorLabel}</Text>
          {itemLabel ? <Text numberOfLines={1} style={styles.itemLabel}>{itemLabel}</Text> : null}
        </View>
        <Text style={[styles.progress, isPalace ? styles.palaceProgress : styles.pegProgress]}>{index + 1}/{total}</Text>
      </View>

      {visual ? <View style={[styles.visual, isPalace ? styles.palaceVisual : styles.pegVisual]}>{visual}</View> : null}

      <Text style={styles.inputLabel}>{t('memoryScene')}</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        multiline
        onChangeText={onChangeText}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor="#AAA7B5"
        style={styles.input}
        textAlignVertical="top"
        value={value}
      />

      {onAction && actionLabel ? (
        <AnimatedPressable onPress={onAction} style={styles.action}>
          <Text style={styles.actionEmoji}>🪄</Text>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.paper, borderWidth: 2, borderColor: theme.line, borderRadius: 20, padding: 14, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: theme.paper },
  pegBadge: { backgroundColor: theme.berry },
  palaceBadge: { backgroundColor: theme.violet },
  badgeText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 12 },
  headerCopy: { flex: 1 },
  anchor: { fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.8 },
  pegText: { color: theme.berryDeep },
  palaceText: { color: theme.violetDeep },
  itemLabel: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 13, marginTop: 2 },
  progress: { borderRadius: 999, fontFamily: typography.bodyExtraBold, fontSize: 10, paddingHorizontal: 8, paddingVertical: 5 },
  pegProgress: { color: theme.berryDeep, backgroundColor: '#FFF0F4' },
  palaceProgress: { color: theme.violetDeep, backgroundColor: '#EEE9FF' },
  visual: { minHeight: 86, borderRadius: 15, marginTop: 12, alignItems: 'center', justifyContent: 'center', padding: 10 },
  pegVisual: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#EADFC4', backgroundColor: '#FFFCF4', flexDirection: 'row', gap: 9 },
  palaceVisual: { borderWidth: 1.5, borderColor: '#DCD4FF', backgroundColor: '#F7F5FF' },
  inputLabel: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12, marginTop: 12 },
  input: { color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19, minHeight: 74, textAlignVertical: 'top', marginTop: 6, borderRadius: 13, borderWidth: 1.5, borderColor: theme.line, backgroundColor: 'white', padding: 11 },
  action: { marginTop: 9, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: 12, borderWidth: 1.5, borderColor: '#FFD9E2', backgroundColor: '#FFF0F4' },
  actionText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  actionEmoji: { fontSize: 16 },
});
