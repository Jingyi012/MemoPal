import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemorySet } from '@/features/memory-sets';
import { typography } from '@/theme/typography';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Archive, ArchiveRestore, Copy, Folder, Globe2, LockKeyhole, Trash2 } from 'lucide-react-native';
import { forwardRef, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MemoryActionsSheetProps = {
  memorySet?: MemorySet;
  isBusy?: boolean;
  onDismiss: () => void;
  onDuplicate?: (memorySet: MemorySet) => void;
  onToggleArchived?: (memorySet: MemorySet) => void;
  onDelete?: (memorySet: MemorySet) => void;
  onRequestVisibility?: (memorySet: MemorySet) => void;
  onMove?: (memorySet: MemorySet) => void;
};

export const MemoryActionsSheet = forwardRef<BottomSheetModal, MemoryActionsSheetProps>(
  ({ memorySet, isBusy = false, onDismiss, onDuplicate, onToggleArchived, onDelete, onRequestVisibility, onMove }, ref) => {
  const { styles, theme } = useStyles();
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
            {onDuplicate ? <ActionRow
              label={t('duplicate')}
              icon={<Copy size={20} color={theme.violetDeep} />}
              iconBackground={theme.violetTint}
              disabled={!memorySet || isBusy}
              onPress={() => memorySet && onDuplicate(memorySet)}
            /> : null}
            {onRequestVisibility ? <ActionRow
              label={memorySet?.visibility === 'public' ? t('makePrivate') : t('makePublic')}
              icon={memorySet?.visibility === 'public' ? <LockKeyhole size={20} color={theme.inkSoft} /> : <Globe2 size={20} color={theme.grass} />}
              iconBackground={memorySet?.visibility === 'public' ? theme.canvas : theme.mintTint}
              disabled={!memorySet || isBusy}
              onPress={() => memorySet && onRequestVisibility(memorySet)}
            /> : null}
            {onToggleArchived ? <ActionRow
              label={isArchived ? t('restore') : t('archive')}
              icon={isArchived
                ? <ArchiveRestore size={20} color={theme.grass} />
                : <Archive size={20} color={theme.inkSoft} />}
              iconBackground={isArchived ? theme.mintTint : theme.canvas}
              disabled={!memorySet || isBusy}
              onPress={() => memorySet && onToggleArchived(memorySet)}
            /> : null}
            {onMove ? <ActionRow
              label={t('moveToFolder')}
              icon={<Folder size={20} color={theme.violetDeep} />}
              iconBackground={theme.violetTint}
              disabled={!memorySet || isBusy}
              onPress={() => memorySet && onMove(memorySet)}
            /> : null}
            {onDelete ? <ActionRow
              label={t('delete')}
              icon={<Trash2 size={20} color={theme.berryDeep} />}
              iconBackground={theme.berryTint}
              destructive
              disabled={!memorySet || isBusy}
              onPress={() => memorySet && onDelete(memorySet)}
            /> : null}
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
  const { styles } = useStyles();
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

const useStyles = createThemedStyles((theme) => StyleSheet.create({
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
}));
