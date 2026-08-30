import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

type GoogleSigninConfig = {
  webClientId: string;
  iosClientId?: string;
  hostedDomain?: string;
};

const GOOGLE_SCOPES = ['openid', 'profile', 'email'];
let googleSigninModulePromise: Promise<GoogleSigninModule | null> | null = null;
let cachedConfigKey: string | null = null;

async function loadGoogleSigninModule(): Promise<GoogleSigninModule | null> {
  if (googleSigninModulePromise) {
    return googleSigninModulePromise;
  }

  googleSigninModulePromise = import('@react-native-google-signin/google-signin')
    .then((module) => module as GoogleSigninModule)
    .catch(() => null);

  return googleSigninModulePromise;
}

function getTokenFromUrl(url: string): string | null {
  const [base, fragment] = url.split('#');
  const queryPart = base.includes('?') ? base.split('?')[1] : '';
  const params = new URLSearchParams([queryPart, fragment].filter(Boolean).join('&'));
  return params.get('access_token') || params.get('token') || params.get('id_token');
}

async function startOAuth(authUrl: string): Promise<string> {
  const redirectUri = Linking.createURL('auth/callback');
  const finalUrl = authUrl.includes('redirect_uri=')
    ? authUrl
    : `${authUrl}${authUrl.includes('?') ? '&' : '?'}redirect_uri=${encodeURIComponent(redirectUri)}`;

  const result = await WebBrowser.openAuthSessionAsync(finalUrl, redirectUri);
  if (result.type !== 'success' || !result.url) {
    throw new Error('Authentication canceled.');
  }

  const token = getTokenFromUrl(result.url);
  if (!token) throw new Error('No access token returned by provider.');
  return token;
}

function readGoogleSigninConfig(): GoogleSigninConfig | null {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID?.trim();
  if (!webClientId) {
    return null;
  }

  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_IOS_CLIENT_ID?.trim();
  const hostedDomain = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_HOSTED_DOMAIN?.trim();

  return {
    webClientId,
    iosClientId: iosClientId || undefined,
    hostedDomain: hostedDomain || undefined,
  };
}

function configureGoogleSignin(module: GoogleSigninModule, config: GoogleSigninConfig): void {
  const configKey = `${config.webClientId}|${config.iosClientId ?? ''}|${config.hostedDomain ?? ''}`;
  if (configKey === cachedConfigKey) {
    return;
  }

  module.GoogleSignin.configure({
    webClientId: config.webClientId,
    iosClientId: config.iosClientId,
    hostedDomain: config.hostedDomain,
    scopes: GOOGLE_SCOPES,
  });

  cachedConfigKey = configKey;
}

function mapGoogleSigninError(error: unknown, module: GoogleSigninModule | null): string {
  const nativeError = error as { code?: unknown; message?: unknown } | null;
  const errorCode = nativeError?.code;
  const errorMessage = typeof nativeError?.message === 'string' ? nativeError.message : '';

  // Google Play Services reports OAuth package/SHA mismatches as status 10
  // (DEVELOPER_ERROR). Keep this actionable instead of exposing the opaque
  // native error text to the user.
  if (
    errorCode === 10 ||
    errorCode === '10' ||
    errorMessage.toUpperCase().includes('DEVELOPER_ERROR')
  ) {
    return Platform.OS === 'android'
      ? 'This Android build is not registered with Google. Add package com.memopal.app and this build\'s SHA-1 certificate to the Google OAuth Android client, then rebuild the app.'
      : 'This app build is not registered with Google OAuth. Check the configured OAuth client and rebuild the app.';
  }

  if (module && module.isErrorWithCode(error)) {
    if (error.code === module.statusCodes.SIGN_IN_CANCELLED) {
      return 'Authentication canceled.';
    }

    if (error.code === module.statusCodes.IN_PROGRESS) {
      return 'Google authentication is already in progress.';
    }

    if (error.code === module.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return 'Google Play Services is unavailable or outdated on this device.';
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Google authentication failed.';
}

function canUseNativeGoogleSignIn(): boolean {
  return Constants.appOwnership !== 'expo';
}

export function isGoogleLoginConfigured(): boolean {
  return !!readGoogleSigninConfig() && canUseNativeGoogleSignIn();
}

export function isFacebookLoginConfigured(): boolean {
  return !!process.env.EXPO_PUBLIC_FACEBOOK_OAUTH_URL?.trim();
}

export async function getGoogleIdToken(): Promise<string> {
  if (Constants.appOwnership === 'expo') {
    throw new Error('Google sign-in requires a development build or production build (Expo Go is not supported).');
  }

  const config = readGoogleSigninConfig();
  if (!config) {
    throw new Error('Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID.');
  }

  const module = await loadGoogleSigninModule();
  if (!module) {
    throw new Error('Google native module is unavailable in this build.');
  }

  configureGoogleSignin(module, config);

  try {
    if (Platform.OS === 'android') {
      await module.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const response = await module.GoogleSignin.signIn();
    if (response.type === 'cancelled') {
      throw new Error('Authentication canceled.');
    }

    const idToken = response.data.idToken ?? (await module.GoogleSignin.getTokens()).idToken;
    if (!idToken) {
      throw new Error('Google ID token was not returned by Google.');
    }

    return idToken;
  } catch (error) {
    throw new Error(mapGoogleSigninError(error, module));
  }
}

export async function getFacebookAccessToken() {
  const authUrl = process.env.EXPO_PUBLIC_FACEBOOK_OAUTH_URL;
  if (!authUrl) throw new Error('Facebook OAuth URL is not configured.');
  return startOAuth(authUrl);
}
