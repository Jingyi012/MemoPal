import AnimatedPressable from '@/components/AnimatedPressable';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemoryFolderCreateRequest } from '../types/memoryFolder.types';

export function FolderNameModal({ visible, initialName, initialEmoji, initialDescription, isLoading, onCancel, onSubmit }: { visible: boolean; initialName?: string; initialEmoji?: string; initialDescription?: string; isLoading?: boolean; onCancel: () => void; onSubmit: (collection: MemoryFolderCreateRequest) => void }) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('library');
  const [name, setName] = useState(initialName ?? '');
  const [emoji, setEmoji] = useState(initialEmoji ?? '📚');
  const [description, setDescription] = useState(initialDescription ?? '');
  useEffect(() => {
    if (!visible) return;
    setName(initialName ?? '');
    setEmoji(initialEmoji ?? '📚');
    setDescription(initialDescription ?? '');
  }, [initialDescription, initialEmoji, initialName, visible]);
  const submit = () => {
    const value = name.trim();
    if (value) onSubmit({ name: value, emoji: emoji.trim() || '📚', description: description.trim() });
  };
  const close = () => onCancel();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <View style={styles.dialog}>
          <Text style={styles.title}>{initialName ? t('editCollection') : t('newFolder')}</Text>
          <Text style={styles.body}>{t('folderNamePrompt')}</Text>
          <TextInput autoFocus value={name} onChangeText={setName} editable={!isLoading} maxLength={80} placeholder={t('folderNamePlaceholder')} placeholderTextColor={theme.inkSoft} style={styles.input} accessibilityLabel={t('folderNamePrompt')} returnKeyType="next" />
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('collectionEmoji')}</Text>
            <TextInput value={emoji} onChangeText={setEmoji} editable={!isLoading} maxLength={16} placeholder={t('collectionEmojiPlaceholder')} placeholderTextColor={theme.inkSoft} style={styles.emojiInput} accessibilityLabel={t('collectionEmoji')} />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('collectionDescription')}</Text>
            <TextInput value={description} onChangeText={setDescription} editable={!isLoading} maxLength={500} multiline numberOfLines={3} textAlignVertical="top" placeholder={t('collectionDescriptionPlaceholder')} placeholderTextColor={theme.inkSoft} style={[styles.input, styles.descriptionInput]} accessibilityLabel={t('collectionDescription')} />
          </View>
          <View style={styles.actions}>
            <AnimatedPressable containerStyle={styles.actionContainer} disabled={isLoading} pressOnIn onPress={close} style={styles.cancel}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </AnimatedPressable>
            <AnimatedPressable containerStyle={styles.actionContainer} disabled={isLoading || !name.trim()} pressOnIn onPress={submit} style={[styles.confirm, (!name.trim() || isLoading) && styles.disabled]}>
              <Text style={styles.confirmText}>{initialName ? t('save') : t('create')}</Text>
            </AnimatedPressable>
          </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(22, 20, 35, 0.42)' },
  sheet: { maxHeight: '90%', backgroundColor: theme.paper, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  sheetContent: { paddingBottom: 24, paddingHorizontal: 20, paddingTop: 8 },
  dialog: { backgroundColor: theme.paper, width: '100%' },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 21, textAlign: 'center' },
  body: { color: theme.inkSoft, fontSize: 13, lineHeight: 19, marginTop: 9, textAlign: 'center' },
  input: { backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: 14, borderWidth: 1.5, color: theme.ink, fontSize: 16, marginTop: 18, minHeight: 50, paddingHorizontal: 14 },
  fieldGroup: { alignItems: 'flex-start', marginTop: 14 },
  fieldLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12, marginBottom: 7 },
  emojiInput: { backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: 14, borderWidth: 1.5, color: theme.ink, fontSize: 25, height: 52, textAlign: 'center', width: 72 },
  descriptionInput: { fontSize: 14, lineHeight: 20, marginTop: 0, minHeight: 84, paddingBottom: 10, paddingTop: 11, width: '100%' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionContainer: { flex: 1 },
  cancel: { alignItems: 'center', backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: 14, borderWidth: 1.5, justifyContent: 'center', minHeight: 50, width: '100%' },
  confirm: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 14, justifyContent: 'center', minHeight: 50, width: '100%' },
  cancelText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  confirmText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  disabled: { opacity: 0.55 },
}));
