import AsyncStorage from '@react-native-async-storage/async-storage';

function storageKey(userId: string, assignmentId: string) {
  return `memopal:education-attempt:${encodeURIComponent(userId)}:${encodeURIComponent(assignmentId)}`;
}

export const educationAttemptSession = {
  getAttemptId(userId: string, assignmentId: string) {
    return AsyncStorage.getItem(storageKey(userId, assignmentId));
  },

  saveAttemptId(userId: string, assignmentId: string, attemptId: string) {
    return AsyncStorage.setItem(storageKey(userId, assignmentId), attemptId);
  },
};
