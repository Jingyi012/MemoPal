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
              <View style={styles.headerIcon}><Pencil size={19} color={theme.violetDeep} /></View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{t('editProfile')}</Text>
                <Text style={styles.subtitle}>{t('editDetails')}</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>{t('displayName')}</Text>
            <View style={styles.inputWrap}>
              <Pencil size={16} color="#9B8CFF" />
              <TextInput
                style={styles.input}
                placeholder={t('displayName')}
                placeholderTextColor="#AAA6B8"
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={80}
                returnKeyType="done"
              />
            </View>

            <Text style={styles.fieldLabel}>{t('email')}</Text>
            <View style={[styles.inputWrap, styles.lockedInputWrap]}>
              <Mail size={16} color={theme.inkSoft} />
              <TextInput
                style={[styles.input, styles.lockedInput]}
                placeholder={t('email')}
                placeholderTextColor="#AAA6B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                editable={false}
                selectTextOnFocus={false}
              />
              <LockKeyhole size={15} color={theme.inkSoft} />
            </View>
            <Text style={styles.helper}>{t('emailImmutable')}</Text>

            <View style={styles.footer}>
              <View style={styles.buttonSlot}>
                <AnimatedPressable onPress={close} style={styles.cancelButton}>
                  <Text style={styles.cancelText}>{t('cancel')}</Text>
                </AnimatedPressable>
              </View>
              <View style={styles.buttonSlot}>
                <AnimatedPressable disabled={saving || !displayName.trim()} onPress={() => { void save(); }} style={[styles.saveButton, (saving || !displayName.trim()) && styles.disabledButton]}>
                  <Check size={17} color="#2B2A3D" />
                  <Text style={styles.saveText}>{saving ? t('saving') : t('save')}</Text>
                </AnimatedPressable>
              </View>
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
  content: { paddingHorizontal: 20, paddingTop: 12 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 11, marginBottom: 15 },
  headerIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 14, height: 42, justifyContent: 'center', width: 42 },
  headerCopy: { flex: 1 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 20 },
  subtitle: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11.5, marginTop: 2 },
  fieldLabel: { color: theme.inkSoft, fontFamily: typography.displayExtraBold, fontSize: 11, letterSpacing: 0.5, marginBottom: 7, marginTop: 17, textTransform: 'uppercase' },
  inputWrap: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 14, borderWidth: 2, flexDirection: 'row', gap: 9, minHeight: 52, paddingHorizontal: 13 },
  lockedInputWrap: { backgroundColor: theme.violetTint, borderColor: theme.line },
  input: { color: theme.ink, flex: 1, fontFamily: typography.bodySemibold, fontSize: 14, paddingVertical: 0 },
  lockedInput: { color: theme.inkSoft },
  helper: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10.5, lineHeight: 16, marginTop: 6 },
  footer: { borderTopColor: theme.line, borderTopWidth: 2, flexDirection: 'row', gap: 10, marginTop: 22, paddingTop: 14, paddingBottom: 5 },
  buttonSlot: { flex: 1 },
  cancelButton: { alignItems: 'center', backgroundColor: theme.sand, borderColor: theme.peachLine, borderRadius: 14, borderWidth: 2, justifyContent: 'center', minHeight: 52, width: '100%' },
  cancelText: { color: theme.inkSoft, fontFamily: typography.displayExtraBold, fontSize: 13 },
  saveButton: { alignItems: 'center', backgroundColor: theme.sun, borderColor: theme.sunDeep, borderRadius: 14, borderWidth: 2, boxShadow: '0px 4px 0px #F2A900', flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 52, width: '100%' },
  saveText: { color: theme.onSun, fontFamily: typography.displayExtraBold, fontSize: 13 },
  disabledButton: { opacity: 0.5 },
}));
