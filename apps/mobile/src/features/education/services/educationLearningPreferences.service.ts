import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseLearningPreferences, type LearningPreferences } from '../utils/educationLearningPreferences';

const key = (userId: string) => `education.learning-preferences.v1.${userId}`;
export const educationLearningPreferences = {
  async read(userId: string) { return parseLearningPreferences(await AsyncStorage.getItem(key(userId))); },
  async save(userId: string, preferences: LearningPreferences) {
    await AsyncStorage.setItem(key(userId), JSON.stringify(preferences));
  },
};
