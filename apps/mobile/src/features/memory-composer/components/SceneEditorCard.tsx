import { createThemedStyles } from '@/theme/createThemedStyles';
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
  inputLabel?: string;
  readOnly?: boolean;
  headerAction?: ReactNode;
  /** Use the denser placement variant when the card shares a viewport with a map. */
  compact?: boolean;
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
  inputLabel,
  readOnly = false,
  headerAction,
  compact = false,
}: SceneEditorCardProps) {
  const { t } = useTranslation('memoryComposer');
  const { styles, theme } = useStyles();
  const isPalace = accent === 'palace';

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <View style={styles.header}>
        <View style={[styles.badge, isPalace ? styles.palaceBadge : styles.pegBadge]}>
          <Text style={styles.badgeText}>{index + 1}</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.anchor, isPalace ? styles.palaceText : styles.pegText]}>{anchorLabel}</Text>
          {itemLabel ? <Text style={styles.itemLabel}>{itemLabel}</Text> : null}
        </View>
        <View style={styles.headerActions}>
          {headerAction}
          <Text style={[styles.progress, isPalace ? styles.palaceProgress : styles.pegProgress]}>{index + 1}/{total}</Text>
        </View>
      </View>

      {visual ? <View style={[styles.visual, isPalace ? styles.palaceVisual : styles.pegVisual, compact && styles.compactVisual]}>{visual}</View> : null}

      <Text style={[styles.inputLabel, compact && styles.compactInputLabel]}>{inputLabel ?? t('memoryScene')}</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        editable={!readOnly}
        multiline
        onChangeText={onChangeText}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor={theme.inkSoft}
        selectionColor={isPalace ? theme.violetDeep : theme.berryDeep}
        cursorColor={isPalace ? theme.violetDeep : theme.berryDeep}
        style={[styles.input, compact && styles.compactInput]}
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

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { backgroundColor: theme.paper, borderWidth: 2, borderColor: theme.line, borderRadius: 20, padding: 14, marginBottom: 16 },
  compactCard: { borderRadius: 18, marginBottom: 12, padding: 13 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: theme.paper },
  pegBadge: { backgroundColor: theme.berry },
  palaceBadge: { backgroundColor: theme.violet },
  badgeText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  headerCopy: { flex: 1 },
  anchor: { fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.8 },
  pegText: { color: theme.berryDeep },
  palaceText: { color: theme.violetDeep },
  itemLabel: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 13, marginTop: 2 },
  progress: { borderRadius: 999, fontFamily: typography.bodyExtraBold, fontSize: 10, paddingHorizontal: 8, paddingVertical: 5 },
  pegProgress: { color: theme.berryDeep, backgroundColor: theme.berryTint },
  palaceProgress: { color: theme.violetDeep, backgroundColor: theme.violetTint },
  visual: { minHeight: 86, borderRadius: 15, marginTop: 12, alignItems: 'center', justifyContent: 'center', padding: 10 },
  compactVisual: { minHeight: 68, marginTop: 10, padding: 8 },
  pegVisual: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.sunLine, backgroundColor: theme.sunTint, flexDirection: 'row', gap: 9 },
  palaceVisual: { borderWidth: 1.5, borderColor: theme.violetLine, backgroundColor: theme.violetTint },
  inputLabel: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12, marginTop: 12 },
  compactInputLabel: { fontSize: 12, marginTop: 10 },
  input: { color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19, minHeight: 74, textAlignVertical: 'top', marginTop: 6, borderRadius: 13, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, padding: 11 },
  compactInput: { fontSize: 13, lineHeight: 19, minHeight: 66, marginTop: 5, padding: 10 },
  action: { marginTop: 9, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: 12, borderWidth: 1.5, borderColor: theme.berryLine, backgroundColor: theme.berryTint },
  actionText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  actionEmoji: { fontSize: 16 },
}));
