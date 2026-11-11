import { appRadii, appSpacing } from '@/theme/designSystem';
import { Image } from 'expo-image';
import { Maximize2, X } from '@/core/icons';
import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { createThemedStyles } from '@/theme/createThemedStyles';

export function ScanPhotoPreview({
  imageUri,
  openLabel,
  closeLabel,
}: {
  imageUri: string;
  openLabel: string;
  closeLabel: string;
}) {
  const { styles } = useStyles();
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

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  thumbnailSlot: {
    width: '100%',
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailButton: {
    width: '100%',
    height: 140,
    flexShrink: 0,
    borderRadius: appRadii.control,
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
    borderRadius: appRadii.pill,
    backgroundColor: 'rgba(18, 17, 26, 0.78)',
  },
  modalPage: {
    flex: 1,
    backgroundColor: '#09090C',
  },
  fullImage: { flex: 1, width: '100%' },
  modalToolbar: { alignItems: 'flex-end', paddingHorizontal: appSpacing.lg, paddingVertical: appSpacing.sm },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: appRadii.hero,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 17, 26, 0.76)',
  },
}));
