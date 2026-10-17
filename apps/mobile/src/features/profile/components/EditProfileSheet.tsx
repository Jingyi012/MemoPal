import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { useTranslation } from '@/core/i18n/useTranslation';
import { typography } from '@/theme/typography';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Check, LockKeyhole, Mail, Pencil } from '@/core/icons';
import React, { forwardRef, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  initialName?: string;
  initialEmail?: string;
  onSave: (payload: {
    displayName: string;
    email: string;
  }) => Promise<void>;
}

type Ref = BottomSheetModal;

export const EditProfileSheet = forwardRef<Ref, Props>(
  ({ initialName = '', initialEmail = '', onSave }, ref) => {
    const { styles, theme } = useStyles();
    const { t } = useTranslation('profile');
    const insets = useSafeAreaInsets();
    const [displayName, setDisplayName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [saving, setSaving] = useState(false);

    useEffect(() => setDisplayName(initialName), [initialName]);
    useEffect(() => setEmail(initialEmail), [initialEmail]);

    const close = () => {
      if (ref && 'current' in ref) ref.current?.dismiss();
    };

    const save = async () => {
      if (!displayName.trim() || saving) return;
      setSaving(true);
      try {
        await onSave({ displayName: displayName.trim(), email });
        close();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('unableUpdate');
        Toast.show({ type: 'error', text1: t('updateFailed'), text2: message || t('unableUpdate') });
      } finally {
        setSaving(false);
      }
    };

    return (
      <CustomBottomSheetModal ref={ref} snapPoints={['78%']} enableDynamicSizing={false}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <BottomSheetScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 14 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.headerIcon}><Pencil size={20} color={theme.paper} /></View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{t('editProfile')}</Text>
                <Text style={styles.subtitle}>{t('editDetails')}</Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <View style={styles.nameLabelRow}>
                <Text style={styles.fieldLabel}>{t('displayName')}</Text>
                <Text style={styles.characterCount}>{displayName.length}/80</Text>
              </View>
              <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder={t('displayName')}
                placeholderTextColor="#AAA6B8"
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={80}
                returnKeyType="done"
                accessibilityLabel={t('displayName')}
              />
              </View>
            </View>

            <View style={styles.emailCard}>
              <View style={styles.emailIcon}><Mail size={17} color={theme.violetDeep} /></View>
              <View style={styles.emailCopy}>
                <Text style={styles.emailLabel}>{t('email')}</Text>
                <Text style={styles.emailValue} numberOfLines={1}>{email}</Text>
              </View>
              <View style={styles.lockBadge}><LockKeyhole size={14} color={theme.inkSoft} /></View>
            </View>
            <Text style={styles.helper}>{t('emailImmutable')}</Text>

            <View style={styles.footer}>
              <AnimatedPressable onPress={close} style={styles.cancelButton}>
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </AnimatedPressable>
              <AnimatedPressable disabled={saving || !displayName.trim()} onPress={() => { void save(); }} style={[styles.saveButton, (saving || !displayName.trim()) && styles.disabledButton]}>
                  <Check size={17} color={theme.paper} />
                  <Text style={styles.saveText}>{saving ? t('saving') : t('save')}</Text>
              </AnimatedPressable>
            </View>
          </BottomSheetScrollView>
        </KeyboardAvoidingView>
      </CustomBottomSheetModal>
    );
  },
);

EditProfileSheet.displayName = 'EditProfileSheet';

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 18 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 13, marginBottom: 25 },
  headerIcon: { alignItems: 'center', backgroundColor: theme.violetDeep, borderRadius: 18, height: 52, justifyContent: 'center', width: 52, boxShadow: '0px 5px 12px rgba(103, 80, 200, 0.22)' },
  headerCopy: { flex: 1 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 22 },
  subtitle: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 12, marginTop: 4 },
  formCard: { padding: 16, borderRadius: 20, backgroundColor: theme.violetTint },
  nameLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  fieldLabel: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  characterCount: { color: theme.inkMuted, fontFamily: typography.bodySemibold, fontSize: 11 },
  inputWrap: { justifyContent: 'center', minHeight: 54, paddingHorizontal: 14, borderWidth: 1.5, borderColor: theme.violetLine, borderRadius: 14, backgroundColor: theme.paper },
  input: { color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 15, paddingVertical: 0 },
  emailCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: theme.line, borderRadius: 18, backgroundColor: theme.paper },
  emailIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: theme.violetTint },
  emailCopy: { flex: 1 },
  emailLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11 },
  emailValue: { color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 13, marginTop: 4 },
  lockBadge: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: theme.sand },
  helper: { color: theme.inkMuted, fontFamily: typography.body, fontSize: 10.5, lineHeight: 15, marginTop: 7, marginLeft: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, paddingTop: 4, paddingBottom: 5 },
  cancelButton: { alignItems: 'center', justifyContent: 'center', minHeight: 54, paddingHorizontal: 18 },
  cancelText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  saveButton: { flex: 1, alignItems: 'center', backgroundColor: theme.violetDeep, borderRadius: 16, boxShadow: '0px 4px 0px #4D37A8', flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 54 },
  saveText: { color: theme.paper, fontFamily: typography.displayExtraBold, fontSize: 14 },
  disabledButton: { opacity: 0.5 },
}));
