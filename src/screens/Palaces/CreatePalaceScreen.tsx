import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLocationMutations } from '@/hooks/useLocation';
import { usePalaceMutations } from '@/hooks/usePalace';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';

type DraftLocation = { name: string; description: string; imageUrl: string };
const DEFAULT_LOCATION_NAMES = ['Entrance', 'Hallway', 'Living Area', 'Kitchen', 'Dining Area', 'Study Corner', 'Bedroom', 'Storage', 'Balcony', 'Exit'];

const defaults = (): DraftLocation[] =>
  DEFAULT_LOCATION_NAMES.map((name, i) => ({
    name,
    description: `Custom location ${i + 1}`,
    imageUrl: `https://picsum.photos/seed/custom-loc-${i + 1}/900/600`,
  }));

async function pickImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Please allow photo library access.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [16, 9] });
  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0].uri;
}

export default function CreatePalaceScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { createPalace } = usePalaceMutations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800');
  const [locations, setLocations] = useState<DraftLocation[]>(defaults());
  const [saving, setSaving] = useState(false);

  const palaceId = useMemo(() => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'), [name]);
  const { createLocation } = useLocationMutations(palaceId || 'temp-palace');

  const onCreate = async () => {
    if (!user?.isPremium) return;
    if (!name.trim()) return Alert.alert('Missing name', 'Please enter a palace name.');

    setSaving(true);
    try {
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

      router.replace(`/palaces/${palace.id}`);
    } finally {
      setSaving(false);
    }
  };

  if (!user?.isPremium) {
    return (
      <View className="flex-1 bg-slate-50">
        <CommonHeader title="Create Palace" hideBackButton={false} backAction={() => router.back()} />
        <View className="p-5"><Text className="text-amber-700">Premium is required to create custom palaces.</Text></View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <CommonHeader title="Create Custom Palace" description="Create 10 locations with custom images" hideBackButton={false} backAction={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="rounded-2xl bg-white p-4">
          <TextInput className="rounded-xl border border-slate-200 px-4 py-3" placeholder="Palace name" value={name} onChangeText={setName} />
          <TextInput className="mt-3 rounded-xl border border-slate-200 px-4 py-3" placeholder="Description" value={description} onChangeText={setDescription} />

          <Text className="mt-4 text-xs font-bold uppercase text-slate-500">Palace Thumbnail</Text>
          <AnimatedPressable onPress={async () => { const uri = await pickImage(); if (uri) setThumbnail(uri); }} className="mt-2 overflow-hidden rounded-xl border border-slate-200">
            <AppImage source={{ uri: thumbnail }} className="h-40 w-full" contentFit="cover" />
          </AnimatedPressable>
        </View>

        <View className="mt-4 gap-3">
          {locations.map((loc, idx) => (
            <View key={idx} className="rounded-2xl bg-white p-3">
              <Text className="mb-2 text-xs font-semibold text-slate-500">Location {idx + 1}</Text>
              <TextInput className="rounded-xl border border-slate-200 px-3 py-2" value={loc.name} onChangeText={(text) => setLocations((prev) => prev.map((x, i) => i === idx ? { ...x, name: text } : x))} />
              <TextInput className="mt-2 rounded-xl border border-slate-200 px-3 py-2" value={loc.description} onChangeText={(text) => setLocations((prev) => prev.map((x, i) => i === idx ? { ...x, description: text } : x))} />
              <AnimatedPressable onPress={async () => { const uri = await pickImage(); if (uri) setLocations((prev) => prev.map((x, i) => i === idx ? { ...x, imageUrl: uri } : x)); }} className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                <AppImage source={{ uri: loc.imageUrl }} className="h-28 w-full" contentFit="cover" />
              </AnimatedPressable>
            </View>
          ))}
        </View>

        <AnimatedPressable onPress={onCreate} className="mt-5 items-center rounded-xl bg-teal-600 py-4">
          <Text className="font-semibold text-white">{saving ? 'Creating...' : 'Create Palace'}</Text>
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}
