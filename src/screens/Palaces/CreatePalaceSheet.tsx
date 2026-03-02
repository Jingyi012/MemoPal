import AnimatedPressable from '@/components/AnimatedPressable';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLocationMutations } from '@/hooks/useLocation';
import { usePalaceMutations } from '@/hooks/usePalace';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, Text, TextInput, View } from 'react-native';

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

export default function CreatePalaceSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { createPalace } = usePalaceMutations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800');
  const [saving, setSaving] = useState(false);

  const palaceId = useMemo(() => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'), [name]);
  const { createLocation } = useLocationMutations(palaceId || 'temp-palace');

  const create = async () => {
    if (!user?.isPremium || !name.trim()) return;

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

      for (let i = 0; i < 10; i += 1) {
        await createLocation.mutateAsync({
          id: `${palace.id}-loc-${i + 1}`,
          palaceId: palace.id,
          position: i + 1,
          name: DEFAULT_LOCATION_NAMES[i],
          description: `Custom location ${i + 1}`,
          imageUrl: `https://picsum.photos/seed/${palace.id}-loc-${i + 1}/900/600`,
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
        <View className="rounded-t-3xl bg-white p-5">
          <Text className="text-xl font-bold text-slate-900">Create Custom Palace</Text>
          {!user?.isPremium ? (
            <Text className="mt-2 text-sm text-amber-600">Premium required to create custom palaces.</Text>
          ) : null}

          <TextInput className="mt-4 rounded-xl border border-slate-200 px-4 py-3" placeholder="Palace name" value={name} onChangeText={setName} />
          <TextInput className="mt-3 rounded-xl border border-slate-200 px-4 py-3" placeholder="Description" value={description} onChangeText={setDescription} />
          <TextInput className="mt-3 rounded-xl border border-slate-200 px-4 py-3" placeholder="Thumbnail URL" value={thumbnail} onChangeText={setThumbnail} />

          <View className="mt-4 flex-row gap-3">
            <AnimatedPressable onPress={onClose} className="flex-1 items-center rounded-xl bg-slate-100 py-3">
              <Text className="font-semibold text-slate-700">Cancel</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={create}
              className={`flex-1 items-center rounded-xl py-3 ${user?.isPremium ? 'bg-teal-600' : 'bg-slate-300'}`}>
              <Text className="font-semibold text-white">{saving ? 'Creating...' : 'Create'}</Text>
            </AnimatedPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
