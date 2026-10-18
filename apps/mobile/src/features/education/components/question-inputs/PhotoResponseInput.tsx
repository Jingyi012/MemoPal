import * as ImagePicker from 'expo-image-picker';
import { Image, Text, View } from 'react-native';
import { useState } from 'react';
import AnimatedPressable from '@/components/AnimatedPressable';
import type { PhotoResponseAnswer, PhotoResponseQuestion } from '../../types/question.types';
import { useQuestionInputStyles } from './questionInputStyles';

type PhotoFile = Readonly<{ uri: string; name: string; type: string }>;

export function PhotoResponseInput({ question, value, onUpload, labels, disabled = false }: {
  question: PhotoResponseQuestion;
  value: PhotoResponseAnswer;
  onUpload: (file: PhotoFile) => Promise<void>;
  labels: Readonly<{ hint: string; choose: string; attached: string; uploading: string; uploadError: string }>;
  disabled?: boolean;
}) {
  const { styles } = useQuestionInputStyles();
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState(false);
  const selectPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const name = asset.fileName ?? asset.uri.split('/').pop() ?? 'response.jpg';
    const type = asset.mimeType ?? (name.toLowerCase().endsWith('.png') ? 'image/png' : name.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg');
    setUploading(true);
    setFailed(false);
    try { await onUpload({ uri: asset.uri, name, type }); }
    catch { setFailed(true); }
    finally { setUploading(false); }
  };

  return <View style={styles.container}>
    <Text style={styles.hint}>{labels.hint}</Text>
    {value.localUri ? <Image accessibilityLabel={question.prompt} source={{ uri: value.localUri }} style={{ width: '100%', height: 220, borderRadius: 12 }} resizeMode="contain" /> : null}
    {value.photoAttachmentId && !value.localUri ? <Text style={styles.hint}>{labels.attached}</Text> : null}
    {failed ? <Text accessibilityRole="alert" style={styles.hint}>{labels.uploadError}</Text> : null}
    <AnimatedPressable accessibilityRole="button" accessibilityLabel={question.prompt} disabled={disabled || uploading} onPress={() => void selectPhoto()} style={[styles.option, (disabled || uploading) && styles.optionDisabled]}>
      <Text style={styles.optionLabel}>{uploading ? labels.uploading : labels.choose}</Text>
    </AnimatedPressable>
  </View>;
}

export type { PhotoFile };
