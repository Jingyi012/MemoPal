import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { AppSheetTextInput } from '@/components/AppSheetTextInput';
import { AppButton } from '@/components/ui/AppButton';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { StyleSheet, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { AppBottomSheet } from '@/components/AppBottomSheet';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemoryFolderCreateRequest } from '../types/memoryFolder.types';

export function FolderNameModal({ visible, initialName, initialEmoji, initialDescription, isLoading, onCancel, onSubmit }: { visible: boolean; initialName?: string; initialEmoji?: string; initialDescription?: string; isLoading?: boolean; onCancel: () => void; onSubmit: (collection: MemoryFolderCreateRequest) => void }) {
  const { styles, theme } = useStyles();
  const { t, language } = useTranslation('library');
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
  return <AppBottomSheet visible={visible} onClose={close} height={530}>
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <View style={styles.dialog}>
          <Text accessibilityRole="header" style={styles.title}>{initialName ? t('editCollection') : t('newFolder')}</Text>
          <Text style={styles.body}>{t('folderNamePrompt')}</Text>
          <AppSheetTextInput autoFocus value={name} onChangeText={setName} editable={!isLoading} maxLength={80} placeholder={t('folderNamePlaceholder')} placeholderTextColor={theme.inkSoft} style={styles.input} accessibilityLabel={t('folderNamePrompt')} returnKeyType="next" />
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('collectionEmoji')}</Text>
            <AppSheetTextInput value={emoji} onChangeText={setEmoji} editable={!isLoading} maxLength={16} placeholder={t('collectionEmojiPlaceholder')} placeholderTextColor={theme.inkSoft} style={styles.emojiInput} accessibilityLabel={t('collectionEmoji')} />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('collectionDescription')}</Text>
            <AppSheetTextInput value={description} onChangeText={setDescription} editable={!isLoading} maxLength={500} multiline numberOfLines={3} textAlignVertical="top" placeholder={t('collectionDescriptionPlaceholder')} placeholderTextColor={theme.inkSoft} style={[styles.input, styles.descriptionInput]} accessibilityLabel={t('collectionDescription')} />
          </View>
          <View style={styles.actions}>
            <AppButton label={t('cancel')} variant="secondary" size="regular" disabled={isLoading} pressOnIn onPress={close} style={styles.actionContainer} />
            <AppButton label={initialName ? t('save') : language === 'zh' ? '创建合集' : 'Create collection'} variant="primary" size="regular" disabled={!name.trim()} loading={Boolean(isLoading)} pressOnIn onPress={submit} style={styles.actionContainer} />
          </View>
          </View>
        </BottomSheetScrollView>
  </AppBottomSheet>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  sheetContent: { paddingBottom: appSpacing.xl, paddingTop: appSpacing.sm },
  dialog: { backgroundColor: theme.paper, width: '100%' },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.prompt.fontSize, textAlign: 'center' },
  body: { color: theme.inkSoft, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight, marginTop: 9, textAlign: 'center' },
  input: { backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: appRadii.control, borderWidth: 1.5, color: theme.ink, fontSize: appTextStyles.cardTitle.fontSize, marginTop: 18, minHeight: 50, paddingHorizontal: 14 },
  fieldGroup: { alignItems: 'flex-start', marginTop: 14 },
  fieldLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, marginBottom: 7 },
  emojiInput: { backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: appRadii.control, borderWidth: 1.5, color: theme.ink, fontSize: appArtworkSizes.small, height: 52, textAlign: 'center', width: 72 },
  descriptionInput: { fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight, marginTop: 0, minHeight: 84, paddingBottom: 10, paddingTop: 11, width: '100%' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionContainer: { flex: 1 },
}));
