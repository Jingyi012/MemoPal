import AnimatedPressable from '@/components/AnimatedPressable';
import type { MemorySet } from '@/features/memory-sets';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Check, Layers, Inbox } from '@/core/icons';
import type { ReactNode } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
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
          <AnimatedPressable disabled={isLoading} onPress={onCancel} style={styles.cancel}>
            <Text style={styles.cancelText}>{t('cancel')}</Text>
          </AnimatedPressable>
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
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(30, 26, 48, 0.58)', flex: 1, justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 24, borderWidth: 1, maxWidth: 380, padding: 20, width: '100%' },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 21, textAlign: 'center' },
  subject: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12, marginTop: 5, textAlign: 'center' },
  scroll: { marginTop: 16, maxHeight: 360 },
  options: { gap: 8 },
  option: { alignItems: 'center', backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: 14, borderWidth: 1, flexDirection: 'row', minHeight: 52, paddingHorizontal: 12 },
  optionIcon: { alignItems: 'center', width: 32 },
  optionText: { color: theme.ink, flex: 1, fontFamily: typography.bodyExtraBold, fontSize: 14, marginHorizontal: 8 },
  cancel: { alignItems: 'center', borderColor: theme.line, borderRadius: 14, borderWidth: 1.5, justifyContent: 'center', marginTop: 14, minHeight: 48 },
  cancelText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  disabled: { opacity: 0.55 },
}));
