import AnimatedPressable from '@/components/AnimatedPressable';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/core/i18n/useTranslation';

export function FolderNameModal({ visible, initialName, isLoading, onCancel, onSubmit }: { visible: boolean; initialName?: string; isLoading?: boolean; onCancel: () => void; onSubmit: (name: string) => void }) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('library');
  const [name, setName] = useState(initialName ?? '');
  useEffect(() => { if (visible) setName(initialName ?? ''); }, [initialName, visible]);
  const submit = () => { const value = name.trim(); if (value) onSubmit(value); };
  return <Modal transparent animationType="fade" visible={visible} statusBarTranslucent accessibilityViewIsModal onRequestClose={onCancel}>
    <View style={styles.backdrop}><View style={styles.dialog}>
      <Text style={styles.title}>{initialName ? t('renameFolder') : t('newFolder')}</Text>
      <Text style={styles.body}>{t('folderNamePrompt')}</Text>
      <TextInput autoFocus value={name} onChangeText={setName} editable={!isLoading} maxLength={80} placeholder={t('folderNamePlaceholder')} placeholderTextColor={theme.inkSoft} style={styles.input} accessibilityLabel={t('folderNamePrompt')} onSubmitEditing={submit} returnKeyType="done" />
      <View style={styles.actions}>
        <AnimatedPressable containerStyle={styles.actionContainer} disabled={isLoading} pressOnIn onPress={onCancel} style={styles.cancel}>
          <Text style={styles.cancelText}>{t('cancel')}</Text>
        </AnimatedPressable>
        <AnimatedPressable containerStyle={styles.actionContainer} disabled={isLoading || !name.trim()} pressOnIn onPress={submit} style={[styles.confirm, (!name.trim() || isLoading) && styles.disabled]}>
          <Text style={styles.confirmText}>{initialName ? t('rename') : t('create')}</Text>
        </AnimatedPressable>
      </View>
    </View></View>
  </Modal>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(30, 26, 48, 0.58)', flex: 1, justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 24, borderWidth: 1, maxWidth: 360, padding: 22, width: '100%' },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 21, textAlign: 'center' },
  body: { color: theme.inkSoft, fontSize: 13, lineHeight: 19, marginTop: 9, textAlign: 'center' },
  input: { backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: 14, borderWidth: 1.5, color: theme.ink, fontSize: 16, marginTop: 18, minHeight: 50, paddingHorizontal: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionContainer: { flex: 1 },
  cancel: { alignItems: 'center', backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: 14, borderWidth: 1.5, justifyContent: 'center', minHeight: 50, width: '100%' },
  confirm: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 14, justifyContent: 'center', minHeight: 50, width: '100%' },
  cancelText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  confirmText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  disabled: { opacity: 0.55 },
}));
