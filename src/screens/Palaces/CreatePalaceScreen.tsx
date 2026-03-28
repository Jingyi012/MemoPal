import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import { useFeatureLimits } from '@/hooks/useFeatureLimits';
import { useLocationMutations } from '@/hooks/useLocation';
import { usePalaceList, usePalaceMutations } from '@/hooks/usePalace';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ImagePlus, MinusCircle, PlusCircle } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

type DraftLocation = { name: string; description: string; imageUrl: string };
const MIN_LOCATIONS = 0;

const makeLocation = (index: number): DraftLocation => ({
  name: `Location ${index}`,
  description: `Custom location ${index}`,
  imageUrl: '',
});

async function pickImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Toast.show({
      type: 'error',
      text1: 'Permission needed',
      text2: 'Please allow photo library access.',
    });
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

export default function CreatePalaceScreen() {
  const router = useRouter();
  const { data: palaces = [] } = usePalaceList();
  const { limits, isLoading: isLoadingLimits } = useFeatureLimits();
  const { createPalace } = usePalaceMutations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [locations, setLocations] = useState<DraftLocation[]>([]);
  const [saving, setSaving] = useState(false);

  const { createLocation } = useLocationMutations('create-palace-draft');
  const customPalacesCount = useMemo(
    () => palaces.filter((palace) => palace.isCustom && !palace.isDeleted).length,
    [palaces]
  );
  const maxPalaces = limits.customPalaces;
  const maxLocations = Math.max(MIN_LOCATIONS, limits.customLocationsPerPalace);
  const canCreateCustomPalace = customPalacesCount < maxPalaces;
  const hasRequiredPalaceDetails = name.trim().length > 0 && thumbnail.trim().length > 0;
  const hasAtLeastOneLocation = locations.length > 0;
  const hasValidLocationImages = locations.every((location) => location.imageUrl.trim().length > 0);
  const canCreateNow =
    !saving &&
    canCreateCustomPalace &&
    hasRequiredPalaceDetails &&
    hasAtLeastOneLocation &&
    locations.length <= maxLocations &&
    hasValidLocationImages;

  useEffect(() => {
    setLocations((prev) => {
      return prev.slice(0, maxLocations);
    });
  }, [maxLocations]);

  const addLocation = () => {
    if (locations.length >= maxLocations) return;
    setLocations((prev) => [...prev, makeLocation(prev.length + 1)]);
  };

  const removeLocation = (index: number) => {
    if (locations.length <= MIN_LOCATIONS) return;
    setLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const onCreate = async () => {
    if (!canCreateCustomPalace) {
      Toast.show({
        type: 'info',
        text1: 'Limit reached',
        text2: `You have reached your custom palace limit (${customPalacesCount}/${maxPalaces}).`,
      });
      return;
    }

    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing name',
        text2: 'Please enter a palace name.',
      });
      return;
    }

    if (!thumbnail.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing thumbnail',
        text2: 'Please upload a palace thumbnail image.',
      });
      return;
    }

    if (locations.length > maxLocations) {
      Toast.show({
        type: 'error',
        text1: 'Too many locations',
        text2: `This plan allows up to ${maxLocations} locations per custom palace.`,
      });
      return;
    }

    if (!hasAtLeastOneLocation) {
      Toast.show({
        type: 'error',
        text1: 'Missing locations',
        text2: 'Please add at least one location before creating the palace.',
      });
      return;
    }

    if (locations.some((location) => !location.imageUrl.trim())) {
      Toast.show({
        type: 'error',
        text1: 'Missing location image',
        text2: 'Please upload an image for each location you added.',
      });
      return;
    }

    setSaving(true);
    try {
      const palace = await createPalace.mutateAsync({
        name: name.trim(),
        description: description.trim() || 'Custom memory palace',
        thumbnail,
        locationsCount: locations.length,
        isLocked: false,
        level: 1,
        isPremium: false,
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
    } catch (error: unknown) {
      console.error('Failed to create custom palace:', error);
      const message =
        error instanceof Error ? error.message : 'Unable to create custom palace right now.';
      Toast.show({
        type: 'error',
        text1: 'Create failed',
        text2: message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingLimits) {
    return (
      <View className="flex-1 bg-slate-50">
        <CommonHeader
          title="Create Palace"
          hideBackButton={false}
          backAction={() => router.back()}
        />
        <View className="p-5">
          <Text className="text-slate-700">Loading feature limits...</Text>
        </View>
      </View>
    );
  }

  if (!canCreateCustomPalace) {
    return (
      <View className="flex-1 bg-slate-50">
        <CommonHeader
          title="Create Palace"
          hideBackButton={false}
          backAction={() => router.back()}
        />
        <View className="p-5">
          <Text className="text-amber-700">
            You have reached your custom palace limit ({customPalacesCount}/{maxPalaces}).
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <CommonHeader
        title="Create Custom Palace"
        description="Create locations with custom images"
        hideBackButton={false}
        backAction={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="rounded-2xl bg-white p-4">
          <TextInput
            className="rounded-xl border border-slate-200 px-4 py-3"
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

          <Text className="mt-4 text-xs font-bold uppercase text-slate-500">Palace Thumbnail</Text>
          <AnimatedPressable
            onPress={async () => {
              const uri = await pickImage();
              if (uri) setThumbnail(uri);
            }}
            className="mt-2 overflow-hidden rounded-xl border border-slate-200">
            {thumbnail ? (
              <View className="h-40 w-full">
                <AppImage
                  source={{ uri: thumbnail }}
                  className="h-full w-full"
                  contentFit="cover"
                />
              </View>
            ) : (
              <View className="h-40 w-full items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50">
                <ImagePlus size={24} color="#475569" />
                <Text className="mt-2 text-sm font-semibold text-slate-700">
                  Add Palace Thumbnail
                </Text>
                <Text className="mt-1 text-xs text-slate-500">Tap to upload</Text>
              </View>
            )}
          </AnimatedPressable>
        </View>

        <View className="mt-4 rounded-2xl bg-white p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-slate-800">
              Locations ({locations.length}/{maxLocations})
            </Text>
            <AnimatedPressable
              onPress={addLocation}
              className={`flex-row items-center rounded-lg px-3 py-2 ${locations.length >= maxLocations ? 'bg-slate-100' : 'bg-teal-50'}`}>
              <PlusCircle size={16} color="#0f766e" />
              <Text className="ml-1 text-xs font-semibold text-teal-700">
                {locations.length >= maxLocations ? 'Limit Reached' : 'Add Location'}
              </Text>
            </AnimatedPressable>
          </View>
        </View>

        <View className="mt-3 gap-3">
          {locations.length === 0 ? (
            <View className="rounded-2xl bg-white p-4">
              <Text className="text-center text-sm text-slate-500">No locations added yet.</Text>
            </View>
          ) : (
            locations.map((loc, idx) => (
              <View key={idx} className="rounded-2xl bg-white p-3">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-xs font-semibold text-slate-500">Location {idx + 1}</Text>
                  <AnimatedPressable
                    onPress={() => removeLocation(idx)}
                    disabled={locations.length <= MIN_LOCATIONS}>
                    <MinusCircle
                      size={18}
                      color={locations.length <= MIN_LOCATIONS ? '#94a3b8' : '#ef4444'}
                    />
                  </AnimatedPressable>
                </View>

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
                    if (uri)
                      setLocations((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, imageUrl: uri } : x))
                      );
                  }}
                  className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                  {loc.imageUrl ? (
                    <View className="h-28 w-full">
                      <AppImage
                        source={{ uri: loc.imageUrl }}
                        className="h-full w-full"
                        contentFit="cover"
                      />
                    </View>
                  ) : (
                    <View className="h-28 w-full items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50">
                      <ImagePlus size={20} color="#475569" />
                      <Text className="mt-1 text-xs font-semibold text-slate-700">
                        Add Location Image
                      </Text>
                      <Text className="mt-1 text-[11px] text-slate-500">Tap to upload</Text>
                    </View>
                  )}
                </AnimatedPressable>
              </View>
            ))
          )}
        </View>

        <AnimatedPressable
          onPress={onCreate}
          disabled={!canCreateNow}
          className={`mt-5 items-center rounded-xl py-4 ${canCreateNow ? 'bg-teal-600' : 'bg-slate-300'}`}>
          <Text className="font-semibold text-white">
            {saving ? 'Creating...' : `Create Palace (${locations.length} locations)`}
          </Text>
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}
