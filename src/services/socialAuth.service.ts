import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

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

export async function getGoogleAccessToken() {
  const authUrl = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_URL;
  if (!authUrl) throw new Error('Google OAuth URL is not configured.');
  return startOAuth(authUrl);
}

export async function getFacebookAccessToken() {
  const authUrl = process.env.EXPO_PUBLIC_FACEBOOK_OAUTH_URL;
  if (!authUrl) throw new Error('Facebook OAuth URL is not configured.');
  return startOAuth(authUrl);
}
