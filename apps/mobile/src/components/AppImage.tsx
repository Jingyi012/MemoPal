import { Image, type ImageProps, type ImageSource } from 'expo-image';
import { resolveMediaUrl } from '@/utils/mediaUrl';
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
  const mapUri = (uri: string) => resolveMediaUrl(uri);

  const normalizeSource = (value: ImageProps['source']): ImageProps['source'] => {
    if (!value) return value;

    if (typeof value === 'string') {
      return mapUri(value);
    }

    if (Array.isArray(value)) {
      const mappedArray: ImageSource[] = value.map((item) => {
        if (typeof item === 'string') {
          return { uri: mapUri(item) };
        }

        if (item && typeof item === 'object' && 'uri' in item && typeof item.uri === 'string') {
          return { ...item, uri: mapUri(item.uri) };
        }

        return item as ImageSource;
      });

      return mappedArray;
    }

    if (typeof value === 'object' && 'uri' in value && value.uri) {
      return { ...value, uri: mapUri(value.uri) };
    }

    return value;
  };

  const resolvedSource: ImageProps['source'] = imageUrl
    ? { uri: mapUri(imageUrl) }
    : normalizeSource(source);

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
