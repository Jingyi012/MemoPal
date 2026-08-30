import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { useTranslation } from '@/core/i18n/useTranslation';
import { typography } from '@/theme/typography';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, LockKeyhole, Mail, Pencil } from 'lucide-react-native';
import React, { forwardRef, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  initialName?: string;
  initialEmail?: string;
  initialAvatarUrl?: string | null;
  onSave: (payload: {
    displayName: string;
    email: string;
    avatarUrl?: string | null;
  }) => Promise<void>;
}

type Ref = BottomSheetModal;

export const EditProfileSheet = forwardRef<Ref, Props>(
  ({ initialName = '', initialEmail = '', initialAvatarUrl = '', onSave }, ref) => {
    const { t } = useTranslation('profile');
    const insets = useSafeAreaInsets();
    const [displayName, setDisplayName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
    const [saving, setSaving] = useState(false);

    useEffect(() => setDisplayName(initialName), [initialName]);
    useEffect(() => setEmail(initialEmail), [initialEmail]);
    useEffect(() => setAvatarUrl(initialAvatarUrl), [initialAvatarUrl]);

    const close = () => {
      if (ref && 'current' in ref) ref.current?.dismiss();
    };

    const chooseAvatar = async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Toast.show({ type: 'error', text1: t('permissionNeeded'), text2: t('allowPhoto') });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets?.length) setAvatarUrl(result.assets[0].uri);
    };

    const save = async () => {
      if (!displayName.trim() || saving) return;
      setSaving(true);
      try {
        await onSave({ displayName: displayName.trim(), email, avatarUrl });
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
              <View style={styles.headerIcon}><Pencil size={19} color="#7A68E0" /></View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{t('editProfile')}</Text>
                <Text style={styles.subtitle}>{t('editDetails')}</Text>
              </View>
            </View>

            <AnimatedPressable onPress={chooseAvatar} style={styles.avatarCard}>
              <View style={styles.avatarWrap}>
                {avatarUrl ? (
                  <AppImage source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
                ) : (
                  <View style={styles.avatarPlaceholder}><Text style={styles.avatarLetter}>{displayName.trim().charAt(0).toUpperCase() || 'M'}</Text></View>
                )}
                <View style={styles.cameraBadge}><Camera size={14} color="#2B2A3D" /></View>
              </View>
              <View style={styles.avatarCopy}>
                <Text style={styles.avatarTitle}>{t('profilePicture')}</Text>
                <Text style={styles.avatarHint}>{t('chooseImage')}</Text>
              </View>
              <Pencil size={16} color="#7A68E0" />
            </AnimatedPressable>

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
              <Mail size={16} color="#AAA6B8" />
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
              <LockKeyhole size={15} color="#AAA6B8" />
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 11, marginBottom: 15 },
  headerIcon: { alignItems: 'center', backgroundColor: '#EEE9FF', borderRadius: 14, height: 42, justifyContent: 'center', width: 42 },
  headerCopy: { flex: 1 },
  title: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 20 },
  subtitle: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 11.5, marginTop: 2 },
  avatarCard: { alignItems: 'center', backgroundColor: '#F7F5FF', borderColor: '#DCD4FF', borderRadius: 18, borderWidth: 2, flexDirection: 'row', gap: 12, padding: 12 },
  avatarWrap: { height: 64, position: 'relative', width: 64 },
  avatarImage: { borderColor: '#FFFFFF', borderRadius: 32, borderWidth: 3, height: 64, width: 64 },
  avatarPlaceholder: { alignItems: 'center', backgroundColor: '#FFC93C', borderColor: '#FFFFFF', borderRadius: 32, borderWidth: 3, height: 64, justifyContent: 'center', width: 64 },
  avatarLetter: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 27 },
  cameraBadge: { alignItems: 'center', backgroundColor: '#FFC93C', borderColor: '#FFFFFF', borderRadius: 13, borderWidth: 2, bottom: -2, height: 26, justifyContent: 'center', position: 'absolute', right: -3, width: 26 },
  avatarCopy: { flex: 1 },
  avatarTitle: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 14 },
  avatarHint: { color: '#7A68E0', fontFamily: typography.bodyBold, fontSize: 11, marginTop: 3 },
  fieldLabel: { color: '#6B6A80', fontFamily: typography.displayExtraBold, fontSize: 11, letterSpacing: 0.5, marginBottom: 7, marginTop: 17, textTransform: 'uppercase' },
  inputWrap: { alignItems: 'center', backgroundColor: '#FFFDF8', borderColor: '#EEE9DC', borderRadius: 14, borderWidth: 2, flexDirection: 'row', gap: 9, minHeight: 52, paddingHorizontal: 13 },
  lockedInputWrap: { backgroundColor: '#F6F3EA', borderColor: '#EEE9DC' },
  input: { color: '#2B2A3D', flex: 1, fontFamily: typography.bodySemibold, fontSize: 14, paddingVertical: 0 },
  lockedInput: { color: '#9A97A7' },
  helper: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 10.5, lineHeight: 16, marginTop: 6 },
  footer: { borderTopColor: '#EEE9DC', borderTopWidth: 2, flexDirection: 'row', gap: 10, marginTop: 22, paddingTop: 14, paddingBottom: 5 },
  buttonSlot: { flex: 1 },
  cancelButton: { alignItems: 'center', backgroundColor: '#F6F3EA', borderColor: '#E8E1D3', borderRadius: 14, borderWidth: 2, justifyContent: 'center', minHeight: 52, width: '100%' },
  cancelText: { color: '#6B6A80', fontFamily: typography.displayExtraBold, fontSize: 13 },
  saveButton: { alignItems: 'center', backgroundColor: '#FFC93C', borderColor: '#F2A900', borderRadius: 14, borderWidth: 2, boxShadow: '0px 4px 0px #F2A900', flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 52, width: '100%' },
  saveText: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 13 },
  disabledButton: { opacity: 0.5 },
});
