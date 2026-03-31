import { DEVICE_ID_STORAGE_KEY } from '@/constants/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

export type DeviceSessionContext = {
  deviceId: string;
  deviceName: string;
};

function buildDeviceName(): string {
  const appOwnership = Constants.appOwnership || 'standalone';
  const platformVersion = Platform.Version == null ? 'unknown' : String(Platform.Version);
  return `${Platform.OS}-${platformVersion}-${appOwnership}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing && existing.trim().length > 0) {
    return existing;
  }

  const generated = Crypto.randomUUID();
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, generated);
  return generated;
}

export async function getDeviceSessionContext(): Promise<DeviceSessionContext> {
  const deviceId = await getOrCreateDeviceId();
  const deviceName = buildDeviceName();
  return { deviceId, deviceName };
}
