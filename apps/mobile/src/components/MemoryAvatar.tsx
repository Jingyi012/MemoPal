import { AppImage } from '@/components/AppImage';
import { LinearGradient } from 'expo-linear-gradient';
import { LockKeyhole } from '@/core/icons';
import type { AvatarDefinition } from '@/features/avatars/types/avatar';
import { momoGrowthScaleForLevel, momoPortraitForKey, momoPortraitForLevel } from '@/features/avatars/momoPortraits';
import type { AppearanceDefinition, EquippedAppearance } from '@/features/appearance/types/appearance';
import { typography } from '@/theme/typography';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View } from 'react-native';
import { memopalThemes } from '@/theme/memopalTheme';

interface Props {
  avatar?: AvatarDefinition | null;
  size?: number;
  level?: number;
  showLevelBadge?: boolean;
  locked?: boolean;
  appearance?: EquippedAppearance;
  imageUrl?: string | null;
}

const momoStageColors = [
  ['#E7F7FF', '#FAF8FF'], ['#E1F4FF', '#F6ECFF'], ['#CDE9FF', '#EEE9FF'],
  ['#D2EDFF', '#E8E4FF'], ['#D8E9FF', '#FFF0D7'], ['#CDEBEF', '#E7E6FF'],
  ['#E8E4FF', '#FFE5E8'], ['#E0E6FF', '#FFF2DF'], ['#D9DCFF', '#F0E6FF'],
  ['#D2DCFF', '#FFF0D8'],
] as const;

export function MemoryAvatar({ avatar, size = 72, level, showLevelBadge = false, locked = false, appearance, imageUrl }: Props) {
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const portraitLevel = avatar?.key.match(/^momo-(0[1-9]|10)$/)?.[1];
  const stageLevel = Math.max(1, Math.min(10, Number(portraitLevel ?? level ?? 1)));
  const borderColor = stageLevel >= 10 ? theme.sun : stageLevel >= 5 ? theme.violet : theme.sky;
  const badgeSize = Math.max(20, Math.round(size * 0.28));
  const hasCustomFrame = Boolean(appearance?.frame);
  const auraPadding = Math.max(2, Math.round(size * 0.045));
  // Keep the avatar at the same usable size as the original avatar rendering.
  // Only the cosmetic frame is enlarged and nudged to align around it.
  const baseImageSize = hasCustomFrame ? size - auraPadding * 2 : size;
  const frameOffsetX = Math.round(size * 0.04);
  const momoPortrait = momoPortraitForKey(avatar?.key) ?? (!avatar ? momoPortraitForLevel(level ?? 1) : null);

  return (
    <View accessible accessibilityLabel={avatar?.titleEn ?? 'Momo'} style={{ width: size, height: size }}>
      <View style={[styles.aura, { borderRadius: size / 2, borderColor: `${borderColor}${hasCustomFrame ? '22' : '55'}`, borderWidth: hasCustomFrame ? 1 : 2, padding: auraPadding }]}>
        <View style={[styles.frame, { borderRadius: size / 2, borderColor, borderWidth: hasCustomFrame ? 0 : 2, backgroundColor: theme.paper }]}>
          <LinearGradient colors={momoStageColors[stageLevel - 1]} style={StyleSheet.absoluteFillObject} />
          {imageUrl || avatar?.imageUrl || momoPortrait ? (
            <View style={[styles.avatarImageSlot, { width: baseImageSize, height: baseImageSize, borderRadius: baseImageSize / 2 }]}>
              {imageUrl || !momoPortrait ? (
                <AppImage
                  contentFit="contain"
                  imageUrl={imageUrl ?? avatar?.imageUrl ?? undefined}
                  placeholder={null}
                  cachePolicy="memory-disk"
                  transition={160}
                  style={[styles.image, { borderRadius: baseImageSize / 2 }]}
                />
              ) : <Image source={momoPortrait} resizeMode="contain" style={[styles.image, { transform: [{ scale: .55 + .45 * momoGrowthScaleForLevel(stageLevel) }] }]} />}
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
  if (!item.imageUrl) return null;
  return <AppImage contentFit="contain" imageUrl={item.imageUrl} placeholder={null} cachePolicy="memory-disk" transition={160} style={style} />;
}

export function AppearanceItemPreview({ item, size = 88 }: { item: AppearanceDefinition; size?: number }) {
  if (!item.imageUrl) return null;
  return (
    <View style={{ width: size, height: size }}>
      <AppImage
        contentFit="contain"
        imageUrl={item.imageUrl ?? undefined}
        placeholder={null}
        cachePolicy="memory-disk"
        transition={160}
        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
      />
    </View>
  );
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
