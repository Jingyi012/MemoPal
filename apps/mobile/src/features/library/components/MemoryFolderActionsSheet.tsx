import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemoryFolder } from '../types/memoryFolder.types';
import { typography } from '@/theme/typography';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Pencil, Trash2 } from '@/core/icons';
import { forwardRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  collection?: MemoryFolder;
  onRename: (collection: MemoryFolder) => void;
  onDelete: (collection: MemoryFolder) => void;
  onDismiss: () => void;
};

export const MemoryFolderActionsSheet = forwardRef<BottomSheetModal, Props>(
  ({ collection, onRename, onDelete, onDismiss }, ref) => {
    const { styles, theme } = useStyles();
    const { t } = useTranslation('library');
    const insets = useSafeAreaInsets();

    return <CustomBottomSheetModal ref={ref} enableDynamicSizing onDismiss={onDismiss} backgroundStyle={styles.sheetBackground}>
      <BottomSheetView style={[styles.content, { paddingBottom: Math.max(insets.bottom, 18) }]}>
        <Text numberOfLines={1} style={styles.title}>{collection?.name ?? ''}</Text>
        <Text style={styles.description}>{t('collectionActionsDescription')}</Text>
        <View style={styles.actions}>
          <ActionRow label={t('editCollection')} icon={<Pencil size={20} color={theme.violetDeep} />} iconBackground={theme.violetTint}
            disabled={!collection} onPress={() => collection && onRename(collection)} />
          <ActionRow label={t('deleteFolder')} icon={<Trash2 size={20} color={theme.berryDeep} />} iconBackground={theme.berryTint}
            destructive disabled={!collection} onPress={() => collection && onDelete(collection)} />
        </View>
      </BottomSheetView>
    </CustomBottomSheetModal>;
  },
);

MemoryFolderActionsSheet.displayName = 'MemoryFolderActionsSheet';

function ActionRow({ label, icon, iconBackground, destructive = false, disabled, onPress }: {
  label: string; icon: ReactNode; iconBackground: string; destructive?: boolean; disabled: boolean; onPress: () => void;
}) {
  const { styles } = useStyles();
  return <AnimatedPressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
    style={[styles.actionRow, disabled && styles.disabled]}>
    <View style={[styles.actionIcon, { backgroundColor: iconBackground }]}>{icon}</View>
    <Text style={[styles.actionLabel, destructive && styles.destructiveLabel]}>{label}</Text>
  </AnimatedPressable>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  sheetBackground: { backgroundColor: theme.paper, borderRadius: 30 },
  content: { paddingHorizontal: appSpacing.xl, paddingTop: appSpacing.md },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.screenTitle.fontSize },
  description: { color: theme.inkSoft, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight, marginTop: 5 },
  actions: { backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: appRadii.card, borderWidth: 1.5, gap: 3, marginTop: 18, overflow: 'hidden', padding: appSpacing.xs },
  actionRow: { alignItems: 'center', backgroundColor: theme.paper, borderRadius: appRadii.control, flexDirection: 'row', minHeight: 64, paddingHorizontal: 14 },
  actionIcon: { alignItems: 'center', borderRadius: appRadii.control, height: 40, justifyContent: 'center', width: 40 },
  actionLabel: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.body.fontSize, marginLeft: appSpacing.md },
  destructiveLabel: { color: theme.berryDeep },
  disabled: { opacity: 0.55 },
}));
