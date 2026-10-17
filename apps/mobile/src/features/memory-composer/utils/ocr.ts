import type { RecognitionResult } from 'expo-mlkit-ocr';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
export { extractMemoryItems, MAX_OCR_ITEMS, parseOcrReviewText, type OcrItem } from './ocrParsing';

export class OcrError extends Error {
  constructor(
    public readonly code: 'unsupported' | 'native-missing' | 'failed',
    message: string,
  ) {
    super(message);
    this.name = 'OcrError';
  }
}

/**
 * Runs the native on-device OCR module. The dynamic import keeps web bundles
 * usable; the native module is only loaded after a phone requests a scan.
 */
export async function recognizeMemoryPhoto(uri: string): Promise<RecognitionResult> {
  if (Platform.OS === 'web') {
    throw new OcrError('unsupported', 'OCR is available on Android and iOS only.');
  }
  if (Constants.appOwnership === 'expo') {
    throw new OcrError('native-missing', 'OCR is not included in Expo Go.');
  }

  try {
    const ocr = await import('expo-mlkit-ocr');
    if (!ocr.isSupported()) {
      throw new OcrError('unsupported', 'This device does not support OCR.');
    }
    return await ocr.recognizeText(uri);
  } catch (error) {
    if (error instanceof OcrError) throw error;
    // A native module cannot be added by Metro or Expo Go. This normally
    // means the installed development build predates the OCR dependency.
    if (error instanceof Error && /Cannot find native module|ExpoMlkitOcr/i.test(error.message)) {
      throw new OcrError('native-missing', 'OCR is not included in this app build.');
    }
    throw new OcrError('failed', 'The text could not be read from this photo.');
  }
}
