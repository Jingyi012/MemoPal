import AnimatedPressable from '@/components/AnimatedPressable';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLocationMutations } from '@/hooks/useLocation';
import { usePalaceMutations } from '@/hooks/usePalace';
import { AppImage } from '@/components/AppImage';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, View } from 'react-native';

type DraftLocation = { name: string; description: string; imageUrl: string };

const DEFAULT_LOCATION_NAMES = [
  'Entrance',
  'Hallway',
  'Living Area',
  'Kitchen',
  'Dining Area',
  'Study Corner',
  'Bedroom',
  'Storage',
  'Balcony',
  'Exit',
];

const createDefaultLocations = (): DraftLocation[] =>
  DEFAULT_LOCATION_NAMES.map((name, index) => ({
    name,
    description: `Custom location ${index + 1}`,
    imageUrl: `https://picsum.photos/seed/custom-loc-${index + 1}/900/600`,
  }));

async function pickImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Please allow photo library access to upload images.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: true,
    aspect: [16, 9],
  });

  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0].uri;
}

export default function CreatePalaceSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { createPalace } = usePalaceMutations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState(
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
  );
  const [locations, setLocations] = useState<DraftLocation[]>(createDefaultLocations());
  const [saving, setSaving] = useState(false);

  const palaceId = useMemo(
    () =>
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-'),
    [name]
  );
  const { createLocation } = useLocationMutations(palaceId || 'temp-palace');

  const create = async () => {
    if (!user?.isPremium) return;
    if (!name.trim()) {
      Alert.alert('Palace name required', 'Please enter a name for your custom palace.');
      return;
    }

    try {
      setSaving(true);
      const palace = await createPalace.mutateAsync({
        id: palaceId || undefined,
        name: name.trim(),
        description: description.trim() || 'Custom memory palace',
        thumbnail,
        locationsCount: 10,
        isLocked: false,
        requiredXp: 0,
        isPremium: true,
        isCustom: true,
      });

      for (let i = 0; i < locations.length; i += 1) {
        const loc = locations[i];
        await createLocation.mutateAsync({
          id: `${palace.id}-loc-${i + 1}`,
          palaceId: palace.id,
          position: i + 1,
          name: loc.name,
          description: loc.description,
          imageUrl: loc.imageUrl,
        });
      }

      onClose();
      router.push(`/palaces/${palace.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[92%] rounded-t-3xl bg-white p-5">
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-xl font-bold text-slate-900">Create Custom Palace</Text>
            {!user?.isPremium ? (
              <Text className="mt-2 text-sm text-amber-600">
                Premium required to create custom palaces.
              </Text>
            ) : null}

            <TextInput
              className="mt-4 rounded-xl border border-slate-200 px-4 py-3"
              placeholder="Palace name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              className="mt-3 rounded-xl border border-slate-200 px-4 py-3"
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
            />

            <Text className="mt-4 text-xs font-bold uppercase text-slate-500">
              Palace Thumbnail
            </Text>
            <AnimatedPressable
              onPress={async () => {
                const uri = await pickImage();
                if (uri) setThumbnail(uri);
              }}
              className="mt-2 overflow-hidden rounded-xl border border-slate-200">
              <View className="h-36">
                <AppImage source={{ uri: thumbnail }} className="w-full" contentFit="cover" />
              </View>

              <View className="absolute right-3 top-3 rounded-full bg-black/50 p-2">
                <ImagePlus size={16} color="white" />
              </View>
            </AnimatedPressable>

            <Text className="mt-5 text-xs font-bold uppercase text-slate-500">
              Locations (with image upload)
            </Text>
            <View className="mt-2 gap-3">
              {locations.map((loc, idx) => (
                <View key={idx} className="rounded-2xl border border-slate-200 p-3">
                  <Text className="mb-2 text-xs font-semibold text-slate-500">
                    Location {idx + 1}
                  </Text>
                  <TextInput
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={loc.name}
                    onChangeText={(text) =>
                      setLocations((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, name: text } : x))
                      )
                    }
                    placeholder="Location name"
                  />
                  <TextInput
                    className="mt-2 rounded-xl border border-slate-200 px-3 py-2"
                    value={loc.description}
                    onChangeText={(text) =>
                      setLocations((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, description: text } : x))
                      )
                    }
                    placeholder="Location description"
                  />
                  <AnimatedPressable
                    onPress={async () => {
                      const uri = await pickImage();
                      if (!uri) return;
                      setLocations((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, imageUrl: uri } : x))
                      );
                    }}
                    className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                    <View className="h-36">
                      <AppImage
                        source={{ uri: loc.imageUrl }}
                        className="w-full"
                        contentFit="cover"
                      />
                    </View>
                  </AnimatedPressable>
                </View>
              ))}
            </View>

            <View className="mt-5 flex-row gap-3">
              <AnimatedPressable
                onPress={onClose}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3">
                <Text className="font-semibold text-slate-700">Cancel</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={create}
                className={`flex-1 items-center rounded-xl py-3 ${user?.isPremium ? 'bg-teal-600' : 'bg-slate-300'}`}>
                <Text className="font-semibold text-white">
                  {saving ? 'Creating...' : 'Create'}
                </Text>
              </AnimatedPressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
