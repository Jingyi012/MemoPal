import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppButton } from '@/components/ui/AppButton';
import type { MemorySet } from '@/features/memory-sets';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Check, Layers, Inbox } from '@/core/icons';
import type { ReactNode } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import type { MemoryFolder } from '../types/memoryFolder.types';

type MemoryMoveModalProps = {
  memorySet?: MemorySet;
  folders: MemoryFolder[];
  isLoading?: boolean;
  onCancel: () => void;
  onCreateFolder: () => void;
  onSelect: (folderId: string | null) => void;
};

export function MemoryMoveModal({ memorySet, folders, isLoading = false, onCancel, onCreateFolder, onSelect }: MemoryMoveModalProps) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('library');
  const options = folders.filter((folder) => folder.id !== memorySet?.memoryFolderId);

  return (
    <Modal transparent animationType="fade" visible={Boolean(memorySet)} statusBarTranslucent accessibilityViewIsModal onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{t('moveToFolder')}</Text>
          <Text numberOfLines={1} style={styles.subject}>{memorySet?.title ?? ''}</Text>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.options}>
            <MoveOption
              label={t('unfiled')}
              selected={memorySet?.memoryFolderId == null}
              icon={<Inbox size={20} color={theme.violetDeep} />}
              disabled={isLoading || memorySet?.memoryFolderId == null}
              onPress={() => onSelect(null)}
            />
            {options.map((folder) => (
              <MoveOption
                key={folder.id}
                label={folder.name}
                icon={<Layers size={20} color={theme.violetDeep} />}
                disabled={isLoading}
                onPress={() => onSelect(folder.id)}
              />
            ))}
            <MoveOption label={t('newFolder')} icon={<Layers size={20} color={theme.violetDeep} />} disabled={isLoading} onPress={onCreateFolder} />
          </ScrollView>
          <AppButton disabled={isLoading} label={t('cancel')} onPress={onCancel} size="regular" style={styles.cancel} variant="secondary" />
        </View>
      </View>
    </Modal>
  );
}

function MoveOption({ label, icon, selected = false, disabled, onPress }: { label: string; icon: ReactNode; selected?: boolean; disabled?: boolean; onPress: () => void }) {
  const { styles, theme } = useStyles();
  return (
    <AnimatedPressable accessibilityRole="button" accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress} style={[styles.option, disabled && styles.disabled]}>
      <View style={styles.optionIcon}>{icon}</View>
      <Text numberOfLines={1} style={styles.optionText}>{label}</Text>
      {selected ? <Check size={18} color={theme.grass} /> : null}
    </AnimatedPressable>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(30, 26, 48, 0.58)', flex: 1, justifyContent: 'center', padding: appSpacing.xxl },
  dialog: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.hero, borderWidth: 1, maxWidth: 380, padding: appSpacing.xl, width: '100%' },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.prompt.fontSize, textAlign: 'center' },
  subject: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize, marginTop: 5, textAlign: 'center' },
  scroll: { marginTop: appSpacing.lg, maxHeight: 360 },
  options: { gap: appSpacing.sm },
  option: { alignItems: 'center', backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: appRadii.control, borderWidth: 1, flexDirection: 'row', minHeight: 52, paddingHorizontal: appSpacing.md },
  optionIcon: { alignItems: 'center', width: 32 },
  optionText: { color: theme.ink, flex: 1, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize, marginHorizontal: appSpacing.sm },
  cancel: { marginTop: 14 },
  disabled: { opacity: 0.55 },
}));
