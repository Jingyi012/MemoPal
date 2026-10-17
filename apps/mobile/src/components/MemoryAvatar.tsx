import { AppImage } from '@/components/AppImage';
import { LockKeyhole } from '@/core/icons';
import type { AvatarDefinition } from '@/features/avatars/types/avatar';
import { typography } from '@/theme/typography';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { memopalThemes } from '@/theme/memopalTheme';

const LOCAL_AVATAR_ASSETS: Record<string, number> = {
  'memory-fox': require('../../assets/avatars/memory-fox.png'),
  'memory-owl': require('../../assets/avatars/memory-owl.png'),
  'memory-otter': require('../../assets/avatars/memory-otter.png'),
  'memory-bear': require('../../assets/avatars/memory-bear.png'),
  'memory-hummingbird': require('../../assets/avatars/memory-hummingbird.png'),
};

interface Props {
  avatar?: AvatarDefinition | null;
  size?: number;
  level?: number;
  showLevelBadge?: boolean;
  locked?: boolean;
}

export function MemoryAvatar({ avatar, size = 72, level, showLevelBadge = false, locked = false }: Props) {
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const asset = avatar ? LOCAL_AVATAR_ASSETS[avatar.assetKey] : LOCAL_AVATAR_ASSETS['memory-fox'];
  const borderColor = avatar && avatar.requiredLevel >= 10 ? theme.sun : avatar && avatar.requiredLevel >= 5 ? theme.violet : theme.sky;
  const badgeSize = Math.max(20, Math.round(size * 0.28));

  return (
    <View accessible accessibilityLabel={avatar?.titleEn ?? 'Memory companion'} style={{ width: size, height: size }}>
      <View style={[styles.aura, { borderRadius: size / 2, borderColor: `${borderColor}55`, padding: Math.max(2, Math.round(size * 0.045)) }]}>
        <View style={[styles.frame, { borderRadius: size / 2, borderColor, backgroundColor: theme.paper }]}>
          {avatar?.imageUrl || asset ? (
            <AppImage
              contentFit="contain"
              imageUrl={avatar?.imageUrl ?? undefined}
              source={avatar?.imageUrl ? undefined : asset}
              style={[styles.image, { borderRadius: size / 2 }]}
            />
          ) : null}
          {locked ? <View style={[styles.lockOverlay, { borderRadius: size / 2 }]}><LockKeyhole color="#FFFFFF" size={Math.max(18, size * 0.25)} /></View> : null}
        </View>
      </View>
      {showLevelBadge && level ? (
        <View style={[styles.levelBadge, { backgroundColor: borderColor, borderColor: theme.paper, height: badgeSize, minWidth: badgeSize, borderRadius: badgeSize / 2 }]}>
          <Text style={[styles.levelBadgeText, { fontSize: Math.max(9, Math.round(size * 0.13)) }]}>{level}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function getLocalAvatarAsset(assetKey: string) {
  return LOCAL_AVATAR_ASSETS[assetKey];
}

const styles = StyleSheet.create({
  aura: { height: '100%', width: '100%', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  frame: { height: '100%', width: '100%', borderWidth: 2, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%', backgroundColor: 'transparent' },
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(28,22,58,0.58)', alignItems: 'center', justifyContent: 'center' },
  levelBadge: { alignItems: 'center', borderWidth: 2, bottom: -2, justifyContent: 'center', position: 'absolute', right: -3 },
  levelBadgeText: { color: '#FFFFFF', fontFamily: typography.bodyExtraBold },
});
