import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import React, { forwardRef, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';

interface Props {
  initialName?: string;
  initialEmail?: string;
  initialAvatarUrl?: string;
  onSave: (payload: { displayName: string; email: string; avatarUrl?: string }) => Promise<void>;
}

type Ref = BottomSheetModal;

export const EditProfileSheet = forwardRef<Ref, Props>(
  ({ initialName = '', initialEmail = '', initialAvatarUrl = '', onSave }, ref) => {
    const [displayName, setDisplayName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
    const [saving, setSaving] = useState(false);

    const close = () => {
      if (ref && 'current' in ref) {
        ref.current?.dismiss();
      }
    };

    return (
      <CustomBottomSheetModal ref={ref} snapPoints={['75%']} enableDynamicSizing={false}>
        <View className="p-6">
          <Text className="text-xl font-bold text-slate-900">Edit Profile</Text>
          <Text className="mt-1 text-sm text-slate-500">Update your profile details</Text>

          <TextInput
            className="mt-4 rounded-xl border border-slate-200 px-4 py-3"
            placeholder="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <TextInput
            className="mt-3 rounded-xl border border-slate-200 px-4 py-3"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text className="mt-4 text-xs font-bold uppercase text-slate-500">Profile Picture</Text>
          <AnimatedPressable
            onPress={async () => {
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                Alert.alert('Permission needed', 'Please allow photo access.');
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
            className="mt-2 overflow-hidden rounded-xl border border-slate-200">
            <View className="h-24 w-24 self-center rounded-full border border-slate-200">
              <AppImage
                source={avatarUrl ? { uri: avatarUrl } : undefined}
                className="h-full w-full rounded-full"
                contentFit="cover"
              />
            </View>
            <Text className="p-3 text-center text-sm text-teal-700">Tap to choose image</Text>
          </AnimatedPressable>

          <View className="mt-5 flex-row gap-3">
            <AnimatedPressable
              onPress={close}
              className="flex-1 items-center rounded-xl bg-slate-100 py-3">
              <Text className="font-semibold text-slate-700">Cancel</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={async () => {
                setSaving(true);
                try {
                  await onSave({ displayName, email, avatarUrl });
                  close();
                } finally {
                  setSaving(false);
                }
              }}
              className="flex-1 items-center rounded-xl bg-teal-600 py-3">
              <Text className="font-semibold text-white">{saving ? 'Saving...' : 'Save'}</Text>
            </AnimatedPressable>
          </View>
        </View>
      </CustomBottomSheetModal>
    );
  }
);
