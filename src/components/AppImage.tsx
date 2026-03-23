import { Image, ImageProps } from 'expo-image';
import { mapLocalhostForExpoGo } from '@/utils/network/localhost';
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
  onError,
  transition = 400, // Standard fade-in duration
  contentFit = 'cover', // Standard fit (replaces resizeMode)
  cachePolicy = 'disk', // Always cache to disk for offline support
  ...props
}: AppImageProps) => {
  const mapUri = (uri: string) => mapLocalhostForExpoGo(uri);

  const normalizeSource = (value: ImageProps['source']) => {
    if (!value) return value;

    if (typeof value === 'string') {
      return mapUri(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) =>
        item && typeof item === 'object' && 'uri' in item && item.uri
          ? { ...item, uri: mapUri(item.uri) }
          : item
      );
    }

    if (typeof value === 'object' && 'uri' in value && value.uri) {
      return { ...value, uri: mapUri(value.uri) };
    }

    return value;
  };

  const resolvedSource = imageUrl ? { uri: mapUri(imageUrl) } : normalizeSource(source);

  const handleError: ImageProps['onError'] = (event) => {
    if (__DEV__) {
      const uri =
        typeof resolvedSource === 'string'
          ? resolvedSource
          : Array.isArray(resolvedSource)
            ? resolvedSource[0] && typeof resolvedSource[0] === 'object' && 'uri' in resolvedSource[0]
              ? resolvedSource[0].uri
              : undefined
            : resolvedSource && typeof resolvedSource === 'object' && 'uri' in resolvedSource
              ? resolvedSource.uri
              : undefined;
      console.warn('[MemoPal][Image] failed to load source:', uri);
    }

    onError?.(event);
  };

  return (
    <Image
      {...props}
      // Prioritize imageUrl if provided, otherwise use standard source prop
      source={resolvedSource}
      onError={handleError}
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
