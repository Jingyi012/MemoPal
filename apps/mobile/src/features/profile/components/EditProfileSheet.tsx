import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import React, { forwardRef, useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

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
    const [displayName, setDisplayName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      setDisplayName(initialName);
    }, [initialName]);

    useEffect(() => {
      setEmail(initialEmail);
    }, [initialEmail]);

    useEffect(() => {
      setAvatarUrl(initialAvatarUrl);
    }, [initialAvatarUrl]);

    const close = () => {
      if (ref && 'current' in ref) {
        ref.current?.dismiss();
      }
    };

    return (
      <CustomBottomSheetModal ref={ref} snapPoints={['75%']} enableDynamicSizing={false}>
        <View className="p-6">
          <Text className="text-xl font-bold text-[#2B2A3D]">Edit Profile</Text>
          <Text className="mt-1 text-sm text-[#6B6A80]">Update your profile details</Text>

          <TextInput
            className="mt-4 rounded-xl border-2 border-[#EEE9DC] bg-[#FFFDF8] px-4 py-3"
            placeholder="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <TextInput
            className="mt-3 rounded-xl border-2 border-[#EEE9DC] bg-[#F6F3EA] px-4 py-3 text-[#9A97A7]"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            editable={false}
            selectTextOnFocus={false}
          />
          <Text className="mt-1 text-xs text-[#6B6A80]">
            Email cannot be changed from mobile profile settings.
          </Text>

          <Text className="mt-4 text-xs font-bold uppercase text-[#6B6A80]">Profile Picture</Text>
          <AnimatedPressable
            onPress={async () => {
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                Toast.show({
                  type: 'error',
                  text1: 'Permission needed',
                  text2: 'Please allow photo access.',
                });
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.8,
                allowsEditing: true,
                aspect: [1, 1],
              });

              if (result.canceled || !result.assets?.length) return;

              setAvatarUrl(result.assets[0].uri);
            }}
            className="mt-2 overflow-hidden rounded-xl border-2 border-[#EEE9DC] bg-[#FFFDF8]">
            <View className="h-24 w-24 self-center rounded-full border-2 border-[#EEE9DC]">
              <AppImage
                source={avatarUrl ? { uri: avatarUrl } : undefined}
                className="h-full w-full rounded-full"
                contentFit="cover"
              />
            </View>
            <Text className="p-3 text-center text-sm text-[#7A68E0]">Tap to choose image</Text>
          </AnimatedPressable>

          <View className="mt-5 flex-row gap-3">
            <AnimatedPressable
              onPress={close}
              className="flex-1 items-center rounded-xl bg-[#F6F3EA] py-3">
              <Text className="font-semibold text-[#6B6A80]">Cancel</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={async () => {
                setSaving(true);
                try {
                  await onSave({ displayName, email, avatarUrl });
                  close();
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : 'Unable to update profile.';
                  Toast.show({
                    type: 'error',
                    text1: 'Update failed',
                    text2: message,
                  });
                } finally {
                  setSaving(false);
                }
              }}
              className="flex-1 items-center rounded-xl bg-[#FFC93C] py-3">
              <Text className="font-semibold text-[#2B2A3D]">{saving ? 'Saving...' : 'Save'}</Text>
            </AnimatedPressable>
          </View>
        </View>
      </CustomBottomSheetModal>
    );
  }
);

EditProfileSheet.displayName = 'EditProfileSheet';
