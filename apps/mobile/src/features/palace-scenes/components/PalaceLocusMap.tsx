import { AppImage } from '@/components/AppImage';
import type { PalaceLocus, PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type PalaceLocusMapProps = {
  scene: PalaceScene;
  loci: PalaceLocus[];
  placedCount: number;
  activeIndex?: number;
  onSelect?: (index: number) => void;
  height?: number;
};

export function PalaceLocusMap({
  scene,
  loci,
  placedCount,
  activeIndex = -1,
  onSelect,
  height,
}: PalaceLocusMapProps) {
  return (
    <View style={[styles.canvas, height ? { height } : undefined]}>
      <AppImage imageUrl={scene.imageUrl} imageSource={scene.imageSource} style={StyleSheet.absoluteFillObject} />
      <View pointerEvents="none" style={styles.floor} />
      {loci.map((locus, index) => {
        const isPlaced = index < placedCount;
        const isActive = index === activeIndex;
        return (
          <View key={locus.id} style={[styles.markerAnchor, { left: `${locus.xPercent}%`, top: `${locus.yPercent}%` }]}>
            {isActive ? <View pointerEvents="none" style={styles.activeHalo} /> : null}
            <Pressable
              accessibilityLabel={`Locus ${index + 1}: ${locus.name}`}
              disabled={!onSelect}
              onPress={() => onSelect?.(index)}
              style={[styles.marker, isPlaced && styles.markerPlaced, isActive && styles.markerActive]}>
              <Text style={styles.markerText}>{index + 1}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    // Keep the canvas in the same 4:3 aspect ratio as authored Palace
    // scenes. This prevents `cover` from cropping the image away from the
    // percentage-based locus coordinates.
    aspectRatio: 4 / 3,
    borderColor: '#E3D7B3',
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#F4EFE0',
    overflow: 'hidden',
  },
  floor: {
    position: 'absolute',
    top: 14,
    right: 14,
    bottom: 14,
    left: 14,
    borderColor: '#CDBD8A',
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  markerAnchor: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    marginLeft: -16,
    marginTop: -16,
    position: 'absolute',
    width: 32,
    zIndex: 2,
  },
  marker: {
    alignItems: 'center',
    backgroundColor: '#9B8CFF',
    borderColor: 'white',
    borderRadius: 16,
    borderWidth: 3,
    height: 32,
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.18)',
    width: 32,
  },
  activeHalo: {
    backgroundColor: 'rgba(255, 196, 63, 0.28)',
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 28,
    borderWidth: 2,
    height: 52,
    position: 'absolute',
    width: 52,
  },
  markerPlaced: {
    backgroundColor: theme.sunDeep,
  },
  markerActive: {
    backgroundColor: '#7A68E0',
    borderColor: theme.sun,
    borderWidth: 4,
    boxShadow: '0px 4px 10px rgba(255, 196, 63, 0.42)',
    transform: [{ scale: 1.1 }],
  },
  markerText: {
    color: 'white',
    fontFamily: typography.bodyExtraBold,
    fontSize: 12,
  },
});
