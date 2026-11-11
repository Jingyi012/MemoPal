import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appTextStyles } from '@/theme/designSystem';
import { AppImage } from '@/components/AppImage';
import type { PalaceLocus, PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useTranslation } from '@/core/i18n/useTranslation';
import { getPalaceLocusName } from '@/features/palace-scenes/utils/palaceLocalization';

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
  const { styles } = useStyles();
  const { language, t } = useTranslation('palace');
  return (
    <View style={[styles.canvas, height ? { height } : undefined]}>
      <AppImage imageUrl={scene.imageUrl} imageSource={scene.imageSource} style={StyleSheet.absoluteFillObject} />
      <View pointerEvents="none" style={styles.floor} />
      <Svg pointerEvents="none" style={StyleSheet.absoluteFillObject} viewBox="0 0 100 100" preserveAspectRatio="none" accessibilityElementsHidden>
        <Polyline
          points={loci.map((locus) => `${locus.xPercent},${locus.yPercent}`).join(' ')}
          fill="none"
          stroke="#FFC43F"
          strokeDasharray="2.2 2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={0.8}
        />
      </Svg>
      {loci.map((locus, index) => {
        const isPlaced = index < placedCount;
        const isActive = index === activeIndex;
        return (
          <View key={locus.id} style={[styles.markerAnchor, { left: `${locus.xPercent}%`, top: `${locus.yPercent}%` }]}>
            {isActive ? <View pointerEvents="none" style={styles.activeHalo} /> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('locusLabel')} ${index + 1}: ${getPalaceLocusName(locus, language)}`}
              accessibilityState={{ selected: isActive, disabled: !onSelect }}
              disabled={!onSelect}
              onPress={() => onSelect?.(index)}
              style={styles.markerTapTarget}>
              <View style={[styles.marker, isPlaced && styles.markerPlaced, isActive && styles.markerActive]}>
                <Text style={styles.markerText}>{index + 1}</Text>
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  canvas: {
    // Keep the canvas in the same 4:3 aspect ratio as authored Palace
    // scenes. This prevents `cover` from cropping the image away from the
    // percentage-based locus coordinates.
    aspectRatio: 4 / 3,
    borderColor: theme.violetLine,
    borderRadius: appRadii.card,
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
    borderRadius: appRadii.control,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  markerAnchor: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    marginLeft: -22,
    marginTop: -22,
    position: 'absolute',
    width: 44,
    zIndex: 2,
  },
  markerTapTarget: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  marker: {
    alignItems: 'center',
    backgroundColor: '#9B8CFF',
    borderColor: 'white',
    borderRadius: appRadii.control,
    borderWidth: 3,
    height: 34,
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.18)',
    width: 34,
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
    fontSize: appTextStyles.caption.fontSize,
  },
}));
