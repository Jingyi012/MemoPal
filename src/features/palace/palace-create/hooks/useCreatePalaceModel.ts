import {
  useLocationMutations,
  usePalaceList,
  usePalaceMutations,
} from '@/features/palace/shared/hooks';
import { useFeatureLimits } from '@/features/subscription/hooks/useFeatureLimits';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Toast from 'react-native-toast-message';

export type DraftLocation = {
  name: string;
  description: string;
  imageUrl: string;
};

export const MIN_CUSTOM_PALACE_LOCATIONS = 0;

function makeLocation(index: number): DraftLocation {
  return {
    name: `Location ${index}`,
    description: `Custom location ${index}`,
    imageUrl: '',
  };
}

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

export function useCreatePalaceModel() {
  const router = useRouter();
  const { data: palaces = [] } = usePalaceList();
  const { limits, isLoading: isLoadingLimits } = useFeatureLimits();
  const { createPalace } = usePalaceMutations();
  const { createLocation } = useLocationMutations('create-palace-draft');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [locations, setLocations] = useState<DraftLocation[]>([]);
  const [saving, setSaving] = useState(false);

  const customPalacesCount = useMemo(
    () => palaces.filter((palace) => palace.isCustom && !palace.isDeleted).length,
    [palaces]
  );
  const maxPalaces = limits.customPalaces;
  const maxLocations = Math.max(MIN_CUSTOM_PALACE_LOCATIONS, limits.customLocationsPerPalace);
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
    setLocations((previous) => previous.slice(0, maxLocations));
  }, [maxLocations]);

  const addLocation = useCallback(() => {
    if (locations.length >= maxLocations) return;
    setLocations((previous) => [...previous, makeLocation(previous.length + 1)]);
  }, [locations.length, maxLocations]);

  const removeLocation = useCallback(
    (index: number) => {
      if (locations.length <= MIN_CUSTOM_PALACE_LOCATIONS) return;
      setLocations((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
    },
    [locations.length]
  );

  const updateLocation = useCallback((index: number, patch: Partial<DraftLocation>) => {
    setLocations((previous) =>
      previous.map((location, currentIndex) =>
        currentIndex === index ? { ...location, ...patch } : location
      )
    );
  }, []);

  const chooseThumbnail = useCallback(async () => {
    const uri = await pickImage();
    if (uri) setThumbnail(uri);
  }, []);

  const chooseLocationImage = useCallback(
    async (index: number) => {
      const uri = await pickImage();
      if (uri) updateLocation(index, { imageUrl: uri });
    },
    [updateLocation]
  );

  const handleBack = useCallback(() => router.back(), [router]);

  const onCreate = useCallback(async () => {
    if (!canCreateCustomPalace) {
      Toast.show({
        type: 'info',
        text1: 'Limit reached',
        text2: `You have reached your custom palace limit (${customPalacesCount}/${maxPalaces}).`,
      });
      return;
    }
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Missing name', text2: 'Please enter a palace name.' });
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

      for (let index = 0; index < locations.length; index += 1) {
        const location = locations[index];
        await createLocation.mutateAsync({
          id: `${palace.id}-loc-${index + 1}`,
          palaceId: palace.id,
          position: index + 1,
          name: location.name,
          description: location.description,
          imageUrl: location.imageUrl,
        });
      }

      router.replace(`/palaces/${palace.id}`);
    } catch (error: unknown) {
      console.error('Failed to create custom palace:', error);
      Toast.show({
        type: 'error',
        text1: 'Create failed',
        text2: error instanceof Error ? error.message : 'Unable to create custom palace right now.',
      });
    } finally {
      setSaving(false);
    }
  }, [
    canCreateCustomPalace,
    createLocation,
    createPalace,
    customPalacesCount,
    description,
    hasAtLeastOneLocation,
    locations,
    maxLocations,
    maxPalaces,
    name,
    router,
    thumbnail,
  ]);

  return {
    name,
    description,
    thumbnail,
    locations,
    saving,
    isLoadingLimits,
    customPalacesCount,
    maxPalaces,
    maxLocations,
    canCreateCustomPalace,
    canCreateNow,
    setName,
    setDescription,
    addLocation,
    removeLocation,
    updateLocation,
    chooseThumbnail,
    chooseLocationImage,
    handleBack,
    onCreate,
  };
}
