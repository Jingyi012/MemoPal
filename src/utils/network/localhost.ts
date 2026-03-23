import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

function normalizeHost(rawValue: string | undefined | null) {
  if (!rawValue) return null;

  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  try {
    const parseInput = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed)
      ? trimmed
      : `http://${trimmed}`;
    const parsed = new URL(parseInput);
    const host = parsed.hostname?.trim();
    return host || null;
  } catch {
    const withoutProtocol = trimmed.replace(/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//, '');
    const withoutPath = withoutProtocol.split('/')[0];
    if (!withoutPath) return null;

    if (withoutPath.startsWith('[')) {
      const closingIndex = withoutPath.indexOf(']');
      if (closingIndex > 1) {
        return withoutPath.slice(1, closingIndex).trim();
      }
    }

    const colonCount = (withoutPath.match(/:/g) ?? []).length;
    if (colonCount > 1) {
      return withoutPath.trim();
    }

    const host = withoutPath.split(':')[0]?.trim();
    return host || null;
  }
}

function resolveMetroScriptHost() {
  return normalizeHost((NativeModules as any)?.SourceCode?.scriptURL);
}

function resolveExpoHost() {
  const candidates = [
    (Constants as any)?.expoGoConfig?.debuggerHost as string | undefined,
    (Constants.expoConfig as any)?.hostUri as string | undefined,
    (Constants.expoConfig as any)?.extra?.expoGo?.debuggerHost as string | undefined,
    (Constants as any)?.manifest?.debuggerHost as string | undefined,
    (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost as string | undefined,
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri as string | undefined,
    resolveMetroScriptHost(),
    process.env.EXPO_PUBLIC_DEV_HOST,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeHost(candidate);
    if (normalized) return normalized;
  }

  return null;
}

export function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

export function mapLocalhostForExpoGo(url: string) {
  if (!__DEV__ || Platform.OS === 'web') return trimTrailingSlash(url);

  try {
    const parsed = new URL(url);
    if (
      parsed.hostname !== 'localhost' &&
      parsed.hostname !== '127.0.0.1' &&
      parsed.hostname !== '::1'
    ) {
      return trimTrailingSlash(parsed.toString());
    }

    const expoHost = resolveExpoHost();
    if (expoHost) {
      parsed.hostname = expoHost;
      return trimTrailingSlash(parsed.toString());
    }

    if (Platform.OS === 'android') {
      parsed.hostname = '10.0.2.2';
      return trimTrailingSlash(parsed.toString());
    }

    return trimTrailingSlash(parsed.toString());
  } catch {
    return trimTrailingSlash(url);
  }
}

