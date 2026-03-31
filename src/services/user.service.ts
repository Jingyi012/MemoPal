import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/constants/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getAccessToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setAccessToken(token: string) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearAccessToken() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string) {
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export async function clearRefreshToken() {
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function clearAuthTokens() {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}
