import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import {
  MIN_CUSTOM_PALACE_LOCATIONS,
  useCreatePalaceModel,
} from '@/features/palace/palace-create/hooks/useCreatePalaceModel';
import { ImagePlus, MinusCircle, PlusCircle } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';

export default function PalaceCreateScreen() {
  const {
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
  } = useCreatePalaceModel();

  if (isLoadingLimits) {
    return (
      <View className="flex-1 bg-slate-50">
        <CommonHeader title="Create Palace" hideBackButton={false} backAction={handleBack} />
        <View className="p-5">
          <ActivityIndicator color="#0f766e" />
        </View>
      </View>
    );
  }

  if (!canCreateCustomPalace) {
    return (
      <View className="flex-1 bg-slate-50">
        <CommonHeader title="Create Palace" hideBackButton={false} backAction={handleBack} />
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
        backAction={handleBack}
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
            onPress={chooseThumbnail}
            className="mt-2 overflow-hidden rounded-xl border border-slate-200">
            {thumbnail ? (
              <View className="h-40 w-full">
                <AppImage source={{ uri: thumbnail }} className="h-full w-full" contentFit="cover" />
              </View>
            ) : (
              <View className="h-40 w-full items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50">
                <ImagePlus size={24} color="#475569" />
                <Text className="mt-2 text-sm font-semibold text-slate-700">Add Palace Thumbnail</Text>
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
            locations.map((location, index) => (
              <View key={index} className="rounded-2xl bg-white p-3">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-xs font-semibold text-slate-500">Location {index + 1}</Text>
                  <AnimatedPressable
                    onPress={() => removeLocation(index)}
                    disabled={locations.length <= MIN_CUSTOM_PALACE_LOCATIONS}>
                    <MinusCircle
                      size={18}
                      color={locations.length <= MIN_CUSTOM_PALACE_LOCATIONS ? '#94a3b8' : '#ef4444'}
                    />
                  </AnimatedPressable>
                </View>

                <TextInput
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={location.name}
                  onChangeText={(text) => updateLocation(index, { name: text })}
                  placeholder="Location name"
                />
                <TextInput
                  className="mt-2 rounded-xl border border-slate-200 px-3 py-2"
                  value={location.description}
                  onChangeText={(text) => updateLocation(index, { description: text })}
                  placeholder="Location description"
                />
                <AnimatedPressable
                  onPress={() => chooseLocationImage(index)}
                  className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                  {location.imageUrl ? (
                    <View className="h-28 w-full">
                      <AppImage
                        source={{ uri: location.imageUrl }}
                        className="h-full w-full"
                        contentFit="cover"
                      />
                    </View>
                  ) : (
                    <View className="h-28 w-full items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50">
                      <ImagePlus size={20} color="#475569" />
                      <Text className="mt-1 text-xs font-semibold text-slate-700">Add Location Image</Text>
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
