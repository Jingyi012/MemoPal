import { Image, ImageProps } from 'expo-image';
import { StyleSheet } from 'react-native';

// Standard "neutral" blurhash (frosted glass look)
const DEFAULT_BLURHASH = 'L6PZfSaD00%L00kq{w^O}v9f00ay';

interface AppImageProps extends ImageProps {
  imageUrl?: string;
  fallbackSource?: string | number;
}

export const AppImage = ({
  imageUrl,
  source,
  style,
  placeholder,
  transition = 400, // Standard fade-in duration
  contentFit = 'cover', // Standard fit (replaces resizeMode)
  cachePolicy = 'disk', // Always cache to disk for offline support
  ...props
}: AppImageProps) => {
  const resolvedSource = imageUrl ? { uri: imageUrl } : source;

  return (
    <Image
      {...props}
      // Prioritize imageUrl if provided, otherwise use standard source prop
      source={resolvedSource}
      style={[styles.base, style]}
      contentFit={contentFit}
      transition={transition}
      cachePolicy={cachePolicy}
      // If no custom blurhash is provided, use the standard one
      placeholder={placeholder || { blurhash: DEFAULT_BLURHASH }}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    width: '100%', // w-full
    height: '100%',
    overflow: 'hidden', // Ensures borderRadius works correctly
    backgroundColor: '#f0f0f0', // Subtle background in case of transparent images
  },
});
