import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import type { PalaceLocus, PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { StyleSheet, Text, View } from 'react-native';

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
  height = 250,
}: PalaceLocusMapProps) {
  return (
    <View style={[styles.canvas, { height }]}>
      <AppImage imageUrl={scene.imageUrl} style={StyleSheet.absoluteFillObject} />
      {loci.map((locus, index) => {
        const isPlaced = index < placedCount;
        const isActive = index === activeIndex;
        return (
          <AnimatedPressable
            key={locus.id}
            accessibilityLabel={`Locus ${index + 1}: ${locus.name}`}
            disabled={!onSelect}
            onPress={() => onSelect?.(index)}
            style={[
              styles.marker,
              isPlaced && styles.markerPlaced,
              isActive && styles.markerActive,
              { left: `${locus.xPercent}%`, top: `${locus.yPercent}%` },
            ]}>
            <Text style={styles.markerText}>{index + 1}</Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    borderColor: '#DCD4FF',
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: '#EAE5D8',
    overflow: 'hidden',
  },
  marker: {
    alignItems: 'center',
    backgroundColor: '#9B8CFF',
    borderColor: 'white',
    borderRadius: 16,
    borderWidth: 3,
    elevation: 4,
    height: 32,
    justifyContent: 'center',
    marginLeft: -16,
    marginTop: -16,
    position: 'absolute',
    shadowColor: '#241F38',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: 32,
  },
  markerPlaced: {
    backgroundColor: theme.sunDeep,
  },
  markerActive: {
    borderColor: theme.ink,
    borderWidth: 4,
    transform: [{ scale: 1.1 }],
  },
  markerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
  },
});
