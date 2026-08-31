import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemorySet } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Archive, ArchiveRestore, Copy, Trash2 } from 'lucide-react-native';
import { forwardRef, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MemoryActionsSheetProps = {
  memorySet?: MemorySet;
  isBusy?: boolean;
  onDismiss: () => void;
  onDuplicate: (memorySet: MemorySet) => void;
  onToggleArchived: (memorySet: MemorySet) => void;
  onDelete: (memorySet: MemorySet) => void;
};

export const MemoryActionsSheet = forwardRef<BottomSheetModal, MemoryActionsSheetProps>(
  ({ memorySet, isBusy = false, onDismiss, onDuplicate, onToggleArchived, onDelete }, ref) => {
    const { t } = useTranslation('library');
    const insets = useSafeAreaInsets();
    const isArchived = memorySet?.status === 'archived';

    return (
      <CustomBottomSheetModal
        ref={ref}
        enableDynamicSizing
        onDismiss={onDismiss}
        backgroundStyle={styles.sheetBackground}>
        <BottomSheetView
          style={[styles.content, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <Text numberOfLines={1} style={styles.title}>{memorySet?.title ?? ''}</Text>
          <Text style={styles.description}>{t('actionsDescription')}</Text>

          <View style={styles.actions}>
            <ActionRow
              label={t('duplicate')}
              icon={<Copy size={20} color={theme.violetDeep} />}
              iconBackground="#EEE9FF"
              disabled={!memorySet || isBusy}
              onPress={() => memorySet && onDuplicate(memorySet)}
            />
            <ActionRow
              label={isArchived ? t('restore') : t('archive')}
              icon={isArchived
                ? <ArchiveRestore size={20} color={theme.grass} />
                : <Archive size={20} color={theme.inkSoft} />}
              iconBackground={isArchived ? '#E9F8F1' : '#F2F0EA'}
              disabled={!memorySet || isBusy}
              onPress={() => memorySet && onToggleArchived(memorySet)}
            />
            <ActionRow
              label={t('delete')}
              icon={<Trash2 size={20} color={theme.berryDeep} />}
              iconBackground="#FFF0F4"
              destructive
              disabled={!memorySet || isBusy}
              onPress={() => memorySet && onDelete(memorySet)}
            />
          </View>

          {isBusy ? (
            <View style={styles.busyRow}>
              <ActivityIndicator size="small" color={theme.violetDeep} />
              <Text style={styles.busyText}>{t('updatingMemory')}</Text>
            </View>
          ) : null}
        </BottomSheetView>
      </CustomBottomSheetModal>
    );
  },
);

MemoryActionsSheet.displayName = 'MemoryActionsSheet';

function ActionRow({
  label,
  icon,
  iconBackground,
  destructive = false,
  disabled,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  iconBackground: string;
  destructive?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.actionRow, disabled && styles.disabled]}>
      <View style={[styles.actionIcon, { backgroundColor: iconBackground }]}>{icon}</View>
      <Text style={[styles.actionLabel, destructive && styles.destructiveLabel]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  sheetBackground: { backgroundColor: theme.paper, borderRadius: 30 },
  content: { paddingHorizontal: 20, paddingTop: 12 },
  title: {
    color: theme.ink,
    fontFamily: typography.displayExtraBold,
    fontSize: 20,
  },
  description: {
    color: theme.inkSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  actions: {
    backgroundColor: theme.canvas,
    borderColor: theme.line,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 3,
    marginTop: 18,
    overflow: 'hidden',
    padding: 4,
  },
  actionRow: {
    alignItems: 'center',
    backgroundColor: theme.paper,
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: 14,
    borderRadius: 15,
  },
  actionIcon: {
    alignItems: 'center',
    borderRadius: 13,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  actionLabel: {
    color: theme.ink,
    fontFamily: typography.bodyExtraBold,
    fontSize: 15,
    marginLeft: 12,
  },
  destructiveLabel: { color: theme.berryDeep },
  disabled: { opacity: 0.55 },
  busyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 36,
    paddingTop: 10,
  },
  busyText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
});
