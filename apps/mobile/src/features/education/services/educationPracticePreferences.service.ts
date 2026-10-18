import AsyncStorage from '@react-native-async-storage/async-storage';
import { parsePracticeFormatPreference } from '@/features/education/utils/educationPracticePreference';
import type { EducationPracticeFormatPreference } from '@/features/education/types/educationPractice.types';

function storageKey(userId: string) {
  return `education.practice.format.${userId}`;
}

export const educationPracticePreferences = {
  async getFormat(userId: string): Promise<EducationPracticeFormatPreference> {
    try { return parsePracticeFormatPreference(await AsyncStorage.getItem(storageKey(userId))); }
    catch { return 'all'; }
  },

  async setFormat(userId: string, format: EducationPracticeFormatPreference): Promise<void> {
    await AsyncStorage.setItem(storageKey(userId), format);
  },
};
