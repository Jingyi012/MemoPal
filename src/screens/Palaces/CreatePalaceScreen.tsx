import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLocationMutations } from '@/hooks/useLocation';
import { usePalaceMutations } from '@/hooks/usePalace';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { MinusCircle, PlusCircle } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';

type DraftLocation = { name: string; description: string; imageUrl: string };
const MAX_LOCATIONS = 100;
const MIN_LOCATIONS = 1;

const makeLocation = (index: number): DraftLocation => ({
  name: `Location ${index}`,
  description: `Custom location ${index}`,
  imageUrl: `https://picsum.photos/seed/custom-loc-${index}/900/600`,
});

const defaults = (): DraftLocation[] => Array.from({ length: 10 }, (_, i) => makeLocation(i + 1));

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

  const addLocation = () => {
    if (locations.length >= MAX_LOCATIONS) return;
    setLocations((prev) => [...prev, makeLocation(prev.length + 1)]);
  };

  const removeLocation = (index: number) => {
    if (locations.length <= MIN_LOCATIONS) return;
    setLocations((prev) => prev.filter((_, i) => i !== index));
  };

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
        locationsCount: locations.length,
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
      <CommonHeader title="Create Custom Palace" description="Create locations with custom images" hideBackButton={false} backAction={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="rounded-2xl bg-white p-4">
          <TextInput className="rounded-xl border border-slate-200 px-4 py-3" placeholder="Palace name" value={name} onChangeText={setName} />
          <TextInput className="mt-3 rounded-xl border border-slate-200 px-4 py-3" placeholder="Description" value={description} onChangeText={setDescription} />

          <Text className="mt-4 text-xs font-bold uppercase text-slate-500">Palace Thumbnail</Text>
          <AnimatedPressable onPress={async () => { const uri = await pickImage(); if (uri) setThumbnail(uri); }} className="mt-2 overflow-hidden rounded-xl border border-slate-200">
            <View className="h-40 w-full">
              <AppImage source={{ uri: thumbnail }} className="w-full h-full" contentFit="cover" />
            </View>
          </AnimatedPressable>
        </View>

        <View className="mt-4 rounded-2xl bg-white p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-slate-800">Locations ({locations.length}/{MAX_LOCATIONS})</Text>
            <AnimatedPressable onPress={addLocation} className="flex-row items-center rounded-lg bg-teal-50 px-3 py-2">
              <PlusCircle size={16} color="#0f766e" />
              <Text className="ml-1 text-xs font-semibold text-teal-700">Add Location</Text>
            </AnimatedPressable>
          </View>
        </View>

        <View className="mt-3 gap-3">
          {locations.map((loc, idx) => (
            <View key={idx} className="rounded-2xl bg-white p-3">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-slate-500">Location {idx + 1}</Text>
                <AnimatedPressable onPress={() => removeLocation(idx)} disabled={locations.length <= MIN_LOCATIONS}>
                  <MinusCircle size={18} color={locations.length <= MIN_LOCATIONS ? '#94a3b8' : '#ef4444'} />
                </AnimatedPressable>
              </View>

              <TextInput className="rounded-xl border border-slate-200 px-3 py-2" value={loc.name} onChangeText={(text) => setLocations((prev) => prev.map((x, i) => (i === idx ? { ...x, name: text } : x)))} placeholder="Location name" />
              <TextInput className="mt-2 rounded-xl border border-slate-200 px-3 py-2" value={loc.description} onChangeText={(text) => setLocations((prev) => prev.map((x, i) => (i === idx ? { ...x, description: text } : x)))} placeholder="Location description" />
              <AnimatedPressable onPress={async () => { const uri = await pickImage(); if (uri) setLocations((prev) => prev.map((x, i) => (i === idx ? { ...x, imageUrl: uri } : x))); }} className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                <View className="h-28 w-full">
                  <AppImage source={{ uri: loc.imageUrl }} className="w-full h-full" contentFit="cover" />
                </View>
              </AnimatedPressable>
            </View>
          ))}
        </View>

        <AnimatedPressable onPress={onCreate} className="mt-5 items-center rounded-xl bg-teal-600 py-4">
          <Text className="font-semibold text-white">{saving ? 'Creating...' : `Create Palace (${locations.length} locations)`}</Text>
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}
