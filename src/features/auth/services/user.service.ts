import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/features/auth/constants/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function normalizeStoredToken(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function getToken(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return normalizeStoredToken(await AsyncStorage.getItem(key));
  }

  const secureToken = normalizeStoredToken(await SecureStore.getItemAsync(key));
  if (secureToken) return secureToken;

  // One-time migration for sessions created before native secure storage.
  const legacyToken = normalizeStoredToken(await AsyncStorage.getItem(key));
  if (!legacyToken) return null;

  await SecureStore.setItemAsync(key, legacyToken, SECURE_STORE_OPTIONS);
  await AsyncStorage.removeItem(key);
  return legacyToken;
}

async function setToken(key: string, token: string): Promise<void> {
  const normalized = normalizeStoredToken(token);
  if (!normalized) throw new Error('Cannot persist an empty authentication token.');

  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, normalized);
    return;
  }

  await SecureStore.setItemAsync(key, normalized, SECURE_STORE_OPTIONS);
  await AsyncStorage.removeItem(key);
}

async function clearToken(key: string): Promise<void> {
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(key);
  }
  await AsyncStorage.removeItem(key);
}

export async function getAccessToken() {
  return getToken(AUTH_TOKEN_KEY);
}

export async function setAccessToken(token: string) {
  await setToken(AUTH_TOKEN_KEY, token);
}

export async function clearAccessToken() {
  await clearToken(AUTH_TOKEN_KEY);
}

export async function getRefreshToken() {
  return getToken(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string) {
  await setToken(REFRESH_TOKEN_KEY, token);
}

export async function clearRefreshToken() {
  await clearToken(REFRESH_TOKEN_KEY);
}

export async function clearAuthTokens() {
  await Promise.all([clearAccessToken(), clearRefreshToken()]);
}
