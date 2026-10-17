import { AppImage } from '@/components/AppImage';
import { LockKeyhole } from '@/core/icons';
import type { AvatarDefinition } from '@/features/avatars/types/avatar';
import type { AppearanceDefinition, EquippedAppearance } from '@/features/appearance/types/appearance';
import { typography } from '@/theme/typography';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { ImageStyle, StyleProp, StyleSheet, Text, View } from 'react-native';
import { memopalThemes } from '@/theme/memopalTheme';

const LOCAL_AVATAR_ASSETS: Record<string, number> = {
  'memory-fox': require('../../assets/avatars/memory-fox.png'),
  'memory-owl': require('../../assets/avatars/memory-owl.png'),
  'memory-otter': require('../../assets/avatars/memory-otter.png'),
  'memory-bear': require('../../assets/avatars/memory-bear.png'),
  'memory-hummingbird': require('../../assets/avatars/memory-hummingbird.png'),
};

const LOCAL_APPEARANCE_ASSETS: Record<string, number> = {
  'constellation-frame': require('../../assets/appearance/constellation-frame.png'),
  'aurora-bloom-frame': require('../../assets/appearance/aurora-bloom-frame.png'),
  'library-gold-frame': require('../../assets/appearance/library-gold-frame.png'),
  'garden-mint-frame': require('../../assets/appearance/garden-mint-frame.png'),
  'starlight-candy-frame': require('../../assets/appearance/starlight-candy-frame.png'),
  'scholar-cap': require('../../assets/appearance/scholar-cap.png'),
  'astral-cape': require('../../assets/appearance/astral-cape.png'),
};

interface Props {
  avatar?: AvatarDefinition | null;
  size?: number;
  level?: number;
  showLevelBadge?: boolean;
  locked?: boolean;
  appearance?: EquippedAppearance;
  imageUrl?: string | null;
}

export function MemoryAvatar({ avatar, size = 72, level, showLevelBadge = false, locked = false, appearance, imageUrl }: Props) {
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const asset = avatar ? LOCAL_AVATAR_ASSETS[avatar.assetKey] : LOCAL_AVATAR_ASSETS['memory-fox'];
  const borderColor = avatar && avatar.requiredLevel >= 10 ? theme.sun : avatar && avatar.requiredLevel >= 5 ? theme.violet : theme.sky;
  const badgeSize = Math.max(20, Math.round(size * 0.28));
  const hasCustomFrame = Boolean(appearance?.frame);
  const auraPadding = Math.max(2, Math.round(size * 0.045));
  // Keep the avatar at the same usable size as the original avatar rendering.
  // Only the cosmetic frame is enlarged and nudged to align around it.
  const baseImageSize = hasCustomFrame ? size - auraPadding * 2 : size;
  const frameOffsetX = Math.round(size * 0.04);

  return (
    <View accessible accessibilityLabel={avatar?.titleEn ?? 'Memory companion'} style={{ width: size, height: size }}>
      <View style={[styles.aura, { borderRadius: size / 2, borderColor: `${borderColor}${hasCustomFrame ? '22' : '55'}`, borderWidth: hasCustomFrame ? 1 : 2, padding: auraPadding }]}>
        <View style={[styles.frame, { borderRadius: size / 2, borderColor, borderWidth: hasCustomFrame ? 0 : 2, backgroundColor: theme.paper }]}>
          {imageUrl || avatar?.imageUrl || asset ? (
            <View style={[styles.avatarImageSlot, { width: baseImageSize, height: baseImageSize, borderRadius: baseImageSize / 2 }]}>
              <AppImage
                contentFit="contain"
                imageUrl={imageUrl ?? avatar?.imageUrl ?? undefined}
                source={imageUrl || avatar?.imageUrl ? undefined : asset}
                style={[styles.image, { borderRadius: baseImageSize / 2 }]}
              />
            </View>
          ) : null}
          {appearance?.outfit ? <AppearanceLayer item={appearance.outfit} style={styles.outfitLayer} /> : null}
        </View>
        {appearance?.frame ? <AppearanceLayer item={appearance.frame} style={[styles.frameLayer, { transform: [{ translateX: frameOffsetX }, { scale: 1.24 }] }]} /> : null}
        {appearance?.decoration ? <AppearanceLayer item={appearance.decoration} style={styles.decorationLayer} /> : null}
        {locked ? <View style={[styles.lockOverlay, { borderRadius: size / 2 }]}><LockKeyhole color="#FFFFFF" size={Math.max(18, size * 0.25)} /></View> : null}
      </View>
      {showLevelBadge && level ? (
        <View style={[styles.levelBadge, { backgroundColor: borderColor, borderColor: theme.paper, height: badgeSize, minWidth: badgeSize, borderRadius: badgeSize / 2 }]}>
          <Text style={[styles.levelBadgeText, { fontSize: Math.max(9, Math.round(size * 0.13)) }]}>{level}</Text>
        </View>
      ) : null}
    </View>
  );
}

function AppearanceLayer({ item, style }: { item: AppearanceDefinition; style: StyleProp<ImageStyle> }) {
  const asset = LOCAL_APPEARANCE_ASSETS[item.assetKey];
  if (!asset && !item.imageUrl) return null;
  return <AppImage contentFit="contain" imageUrl={item.imageUrl ?? undefined} source={item.imageUrl ? undefined : asset} style={style} />;
}

export function AppearanceItemPreview({ item, size = 88 }: { item: AppearanceDefinition; size?: number }) {
  const asset = LOCAL_APPEARANCE_ASSETS[item.assetKey];
  if (!asset && !item.imageUrl) return null;
  return (
    <View style={{ width: size, height: size }}>
      <AppImage
        contentFit="contain"
        imageUrl={item.imageUrl ?? undefined}
        source={item.imageUrl ? undefined : asset}
        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
      />
    </View>
  );
}

export function getLocalAvatarAsset(assetKey: string) {
  return LOCAL_AVATAR_ASSETS[assetKey];
}

const styles = StyleSheet.create({
  aura: { height: '100%', width: '100%', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  frame: { height: '100%', width: '100%', borderWidth: 2, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  avatarImageSlot: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%', backgroundColor: 'transparent' },
  outfitLayer: { ...StyleSheet.absoluteFillObject, zIndex: 2, backgroundColor: 'transparent' },
  // Scale from the center so the frame surrounds the avatar without relying
  // on per-asset left/top offsets that make different frames drift.
  frameLayer: { ...StyleSheet.absoluteFillObject, zIndex: 3, backgroundColor: 'transparent' },
  decorationLayer: { position: 'absolute', width: '62%', height: '62%', right: '-18%', top: '-18%', zIndex: 4, backgroundColor: 'transparent' },
  lockOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 5, backgroundColor: 'rgba(28,22,58,0.58)', alignItems: 'center', justifyContent: 'center' },
  levelBadge: { alignItems: 'center', borderWidth: 2, bottom: -2, justifyContent: 'center', position: 'absolute', right: -3 },
  levelBadgeText: { color: '#FFFFFF', fontFamily: typography.bodyExtraBold },
});
