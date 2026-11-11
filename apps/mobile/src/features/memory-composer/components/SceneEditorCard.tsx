import { AppText as Text } from '@/components/ui/AppText';
import { AppTextInput as TextInput } from '@/components/ui/AppTextInput';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
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
  card: { backgroundColor: theme.paper, borderWidth: 2, borderColor: theme.line, borderRadius: appRadii.card, padding: 14, marginBottom: appSpacing.lg },
  compactCard: { borderRadius: appRadii.card, marginBottom: appSpacing.md, padding: 13 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  badge: { width: 32, height: 32, borderRadius: appRadii.control, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: theme.paper },
  pegBadge: { backgroundColor: theme.berry },
  palaceBadge: { backgroundColor: theme.violet },
  badgeText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  headerCopy: { flex: 1 },
  anchor: { fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, letterSpacing: 0.8 },
  pegText: { color: theme.berryDeep },
  palaceText: { color: theme.violetDeep },
  itemLabel: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: appTextStyles.small.fontSize, marginTop: 2 },
  progress: { borderRadius: appRadii.pill, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, paddingHorizontal: appSpacing.sm, paddingVertical: 5 },
  pegProgress: { color: theme.berryDeep, backgroundColor: theme.berryTint },
  palaceProgress: { color: theme.violetDeep, backgroundColor: theme.violetTint },
  visual: { minHeight: 86, borderRadius: appRadii.control, marginTop: appSpacing.md, alignItems: 'center', justifyContent: 'center', padding: 10 },
  compactVisual: { minHeight: 68, marginTop: 10, padding: appSpacing.sm },
  pegVisual: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.sunLine, backgroundColor: theme.sunTint, flexDirection: 'row', gap: 9 },
  palaceVisual: { borderWidth: 1.5, borderColor: theme.violetLine, backgroundColor: theme.violetTint },
  inputLabel: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, marginTop: appSpacing.md },
  compactInputLabel: { fontSize: appTextStyles.caption.fontSize, marginTop: 10 },
  input: { color: theme.ink, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight, minHeight: 74, textAlignVertical: 'top', marginTop: 6, borderRadius: appRadii.control, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, padding: 11 },
  compactInput: { fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight, minHeight: 66, marginTop: 5, padding: 10 },
  action: { marginTop: 9, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: appRadii.control, borderWidth: 1.5, borderColor: theme.berryLine, backgroundColor: theme.berryTint },
  actionText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  actionEmoji: { fontSize: appTextStyles.cardTitle.fontSize },
}));
