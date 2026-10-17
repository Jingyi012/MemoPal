import { Image, StyleSheet, View } from 'react-native';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import type { AppearanceDefinition, AppearanceItemType } from '@/features/appearance/types/appearance';
import type { CompanionLook } from '@/features/profile/api/companion.api';
import React, { useState } from 'react';

const OWL_BASE = require('../../../../assets/companions/memory-owl/base.png');
const APPROVED_OWL_LAYERS: Record<string, { source: number; itemType: AppearanceItemType }> = {
  'celestial-headband': { source: require('../../../../assets/companions/memory-owl/celestial-headband.png'), itemType: 'headwear' },
  'celestial-scarf': { source: require('../../../../assets/companions/memory-owl/celestial-scarf.png'), itemType: 'bodywear' },
  'memory-owl/garden-headband': { source: require('../../../../assets/companions/memory-owl/garden-headband.png'), itemType: 'headwear' },
  'memory-owl/garden-scarf': { source: require('../../../../assets/companions/memory-owl/garden-scarf.png'), itemType: 'bodywear' },
};
const SLOT_ORDER: { type: AppearanceItemType; slot: keyof CompanionLook }[] = [
  { type: 'backwear', slot: 'backwearId' },
  { type: 'bodywear', slot: 'bodywearId' },
  { type: 'handItem', slot: 'handItemId' },
  { type: 'headwear', slot: 'headwearId' },
];

type Props = {
  look?: CompanionLook | null;
  items: readonly AppearanceDefinition[];
  avatarId?: string | null;
  size: number;
  accessibilityLabel: string;
};

export function isApprovedCompanionLayer(item: AppearanceDefinition, avatarId?: string | null) {
  return item.isActive && isCompanionCompatible(item, avatarId) && Boolean(getApprovedLayer(item) || getApprovedRemoteLayer(item));
}

export function getApprovedCompanionLayerSource(item: AppearanceDefinition, avatarId?: string | null) {
  if (!isApprovedCompanionLayer(item, avatarId)) return undefined;
  return getApprovedRemoteLayer(item) ?? getApprovedLayer(item);
}

export function isCompanionCompatible(item: AppearanceDefinition, avatarId?: string | null) {
  return item.companionAvatarKey === 'memory-owl' || Boolean(avatarId && item.companionAvatarKey === avatarId);
}

export function CompanionCharacterArtwork({ look, items, avatarId, size, accessibilityLabel }: Props) {
  const layers = SLOT_ORDER.flatMap(({ slot }) => {
    const itemId = look?.[slot];
    if (!itemId) return [];
    const item = items.find((candidate) => candidate.id === itemId);
    return item && item.itemType === slotType(slot) && isApprovedCompanionLayer(item, avatarId) ? [{ item }] : [];
  });

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={{ width: size, height: size }}>
      <Image source={OWL_BASE} style={[styles.layer, { width: size, height: size }]} resizeMode="contain" accessible={false} />
      {layers.map(({ item }) => <CompanionLayerImage key={item.id} item={item} size={size} />)}
    </View>
  );
}

function CompanionLayerImage({ item, size }: { item: AppearanceDefinition; size: number }) {
  const remote = getApprovedRemoteLayer(item);
  const local = getApprovedLayer(item);
  const [remoteFailed, setRemoteFailed] = useState(false);
  if (remote && !remoteFailed) {
    return <Image source={{ uri: resolveMediaUrl(remote) }} onError={() => setRemoteFailed(true)} style={[styles.layer, styles.transparent, { width: size, height: size }]} resizeMode="contain" accessible={false} />;
  }
  return local ? <Image source={local} style={[styles.layer, styles.transparent, { width: size, height: size }]} resizeMode="contain" accessible={false} /> : null;
}

function getApprovedRemoteLayer(item: AppearanceDefinition) {
  // Admin validates remote owl wearables as transparent 1254×1254 full-canvas layers.
  // Require the explicit owl key and exact slot type; never treat arbitrary imageUrl
  // values or thumbnails as compositable assets.
  if (!item.isActive || item.companionAvatarKey !== 'memory-owl' || !item.itemType || !SLOT_ORDER.some(({ type }) => type === item.itemType)) return undefined;
  const uri = item.imageUrl?.trim();
  return uri || undefined;
}

function getApprovedLayer(item: AppearanceDefinition) {
  const normalized = item.assetKey.toLowerCase().replace(/\.png$/, '');
  const basename = normalized.split('/').pop() ?? normalized;
  const approved = APPROVED_OWL_LAYERS[normalized] ?? APPROVED_OWL_LAYERS[basename];
  return approved?.itemType === item.itemType ? approved.source : undefined;
}

function slotType(slot: keyof CompanionLook): AppearanceItemType {
  if (slot === 'headwearId') return 'headwear';
  if (slot === 'bodywearId') return 'bodywear';
  if (slot === 'backwearId') return 'backwear';
  return 'handItem';
}

const styles = StyleSheet.create({ layer: { position: 'absolute', top: 0, left: 0 }, transparent: { backgroundColor: 'transparent' } });

