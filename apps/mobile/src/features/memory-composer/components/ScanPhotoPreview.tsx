import { Image } from 'expo-image';
import { Maximize2, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';

export function ScanPhotoPreview({
  imageUri,
  imageAspectRatio,
  openLabel,
  closeLabel,
}: {
  imageUri: string;
  imageAspectRatio: number | null;
  openLabel: string;
  closeLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const window = useWindowDimensions();
  const previewWidth = Math.max(1, window.width - 32);
  const naturalHeight = imageAspectRatio ? previewWidth / imageAspectRatio : 220;
  const previewHeight = Math.max(120, Math.min(naturalHeight, window.height * 0.48));

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={openLabel}
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [
          styles.thumbnailButton,
          { height: previewHeight },
          pressed && styles.thumbnailPressed,
        ]}>
        <Image source={{ uri: imageUri }} contentFit="contain" style={styles.thumbnail} />
        <View pointerEvents="none" style={styles.openBadge}>
          <Maximize2 size={15} color="white" strokeWidth={2.4} />
          <Text style={styles.openBadgeText}>{openLabel}</Text>
        </View>
      </Pressable>

      <Modal
        animationType="fade"
        statusBarTranslucent
        visible={isOpen}
        accessibilityViewIsModal
        onRequestClose={() => setIsOpen(false)}>
        <SafeAreaView style={styles.modalPage}>
          <Image
            source={{ uri: imageUri }}
            contentFit="contain"
            accessibilityLabel={openLabel}
            style={styles.fullImage}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            hitSlop={8}
            onPress={() => setIsOpen(false)}
            style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}>
            <X size={24} color="white" strokeWidth={2.5} />
          </Pressable>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbnailButton: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: theme.line,
    overflow: 'hidden',
  },
  thumbnailPressed: { opacity: 0.86 },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EEEAE3',
  },
  openBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(18, 17, 26, 0.76)',
    paddingHorizontal: 11,
  },
  openBadgeText: {
    color: 'white',
    fontFamily: typography.bodyExtraBold,
    fontSize: 11,
  },
  modalPage: {
    flex: 1,
    backgroundColor: '#09090C',
  },
  fullImage: { flex: 1, width: '100%' },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 17, 26, 0.76)',
  },
  closePressed: { opacity: 0.72 },
});
