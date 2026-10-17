import { AppImage } from '@/components/AppImage';
import type { AppearanceDefinition, AppearanceItemType } from '@/features/appearance/types/appearance';
import type { CompanionLook } from '@/features/profile/api/companion.api';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const SLOT_ORDER: { type: AppearanceItemType; slot: keyof CompanionLook }[] = [
  { type: 'backwear', slot: 'backwearId' },
  { type: 'bodywear', slot: 'bodywearId' },
  { type: 'handItem', slot: 'handItemId' },
  { type: 'headwear', slot: 'headwearId' },
];

type Props = {
  look?: CompanionLook | null;
  items: readonly AppearanceDefinition[];
  companionKey?: string | null;
  characterImageUrl?: string | null;
  size: number;
  accessibilityLabel: string;
};

export function isApprovedCompanionLayer(item: AppearanceDefinition, companionKey?: string | null) {
  return item.isActive && isCompanionCompatible(item, companionKey) && Boolean(item.imageUrl?.trim()) &&
    SLOT_ORDER.some(({ type }) => type === item.itemType);
}

export function getApprovedCompanionLayerSource(item: AppearanceDefinition, companionKey?: string | null) {
  return isApprovedCompanionLayer(item, companionKey) ? item.imageUrl ?? undefined : undefined;
}

export function isCompanionCompatible(item: AppearanceDefinition, companionKey?: string | null) {
  return Boolean(companionKey && item.companionAvatarKey === companionKey);
}

export function CompanionCharacterArtwork({ look, items, companionKey, characterImageUrl, size, accessibilityLabel }: Props) {
  const layers = SLOT_ORDER.flatMap(({ slot }) => {
    const itemId = look?.[slot];
    if (!itemId) return [];
    const item = items.find((candidate) => candidate.id === itemId);
    return item && isApprovedCompanionLayer(item, companionKey) ? [{ item }] : [];
  });

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={{ width: size, height: size }}>
      {characterImageUrl ? <AppImage imageUrl={characterImageUrl} style={[styles.layer, styles.transparent, { width: size, height: size }]} contentFit="contain" accessible={false} /> : null}
      {layers.map(({ item }) => <AppImage key={item.id} imageUrl={item.imageUrl ?? undefined} style={[styles.layer, styles.transparent, { width: size, height: size }]} contentFit="contain" accessible={false} />)}
    </View>
  );
}

const styles = StyleSheet.create({ layer: { position: 'absolute', top: 0, left: 0 }, transparent: { backgroundColor: 'transparent' } });
