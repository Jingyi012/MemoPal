import { AppImage } from '@/components/AppImage';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export function CompanionPortraitArtwork({ imageUrl, size, accessibilityLabel }: {
  imageUrl?: string | null;
  size: number;
  accessibilityLabel: string;
}) {
  if (!imageUrl) return null;
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={{ width: size, height: size }}>
      <AppImage
        imageUrl={imageUrl}
        contentFit="contain"
        accessible={false}
        style={[styles.image, { width: size, height: size }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({ image: { backgroundColor: 'transparent' } });
