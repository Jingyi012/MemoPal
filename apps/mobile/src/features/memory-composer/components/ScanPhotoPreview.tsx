import { Image } from 'expo-image';
import { Maximize2, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { memopalTheme as theme } from '@/theme/memopalTheme';

export function ScanPhotoPreview({
  imageUri,
  openLabel,
  closeLabel,
}: {
  imageUri: string;
  openLabel: string;
  closeLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <View style={styles.thumbnailSlot}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={openLabel}
          onPress={() => setIsOpen(true)}
          activeOpacity={0.86}
          style={styles.thumbnailButton}>
          <Image source={{ uri: imageUri }} contentFit="contain" style={styles.previewImage} />
          <View pointerEvents="none" style={styles.openBadge}>
            <Maximize2 size={13} color="white" strokeWidth={2.4} />
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        statusBarTranslucent
        visible={isOpen}
        accessibilityViewIsModal
        onRequestClose={() => setIsOpen(false)}>
        <SafeAreaProvider>
        <SafeAreaView style={styles.modalPage}>
          <View style={styles.modalToolbar}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              activeOpacity={0.72}
              onPress={() => setIsOpen(false)}
              style={styles.closeButton}>
              <X size={24} color="white" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: imageUri }}
            contentFit="contain"
            accessibilityLabel={openLabel}
            style={styles.fullImage}
          />
        </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbnailSlot: {
    width: '100%',
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailButton: {
    width: 88,
    height: 88,
    flexShrink: 0,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: theme.line,
    backgroundColor: theme.sand,
    overflow: 'hidden',
  },
  previewImage: StyleSheet.absoluteFillObject,
  openBadge: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(18, 17, 26, 0.78)',
  },
  modalPage: {
    flex: 1,
    backgroundColor: '#09090C',
  },
  fullImage: { flex: 1, width: '100%' },
  modalToolbar: { alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 8 },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 17, 26, 0.76)',
  },
});
