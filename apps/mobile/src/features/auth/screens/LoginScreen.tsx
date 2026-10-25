import { AuthLayout } from '../components/AuthLayout';
import { AuthField } from '../components/AuthField';
import { authApi } from '@/features/auth/api/auth';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useAuth } from '@/contexts/AuthProvider';
import {
  getFacebookAccessToken,
  getGoogleIdToken,
  isFacebookLoginConfigured,
  isGoogleLoginConfigured,
} from '@/features/auth/services/socialAuth.service';
import { LoginMethods } from '@/features/auth/types/auth';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from '@/core/i18n/useTranslation';
import { getSafeAuthReturnTo } from '@/features/auth/utils/safeAuthReturnTo';

const DEFAULT_LOGIN_METHODS: LoginMethods = {
  emailPassword: true,
  google: true,
  facebook: false,
};

export const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { returnTo: returnToParam } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const returnTo = getSafeAuthReturnTo(Array.isArray(returnToParam) ? returnToParam[0] : returnToParam);
  const continueAfterLogin = () => router.replace((returnTo ?? '/') as Href);
  const { t } = useTranslation('auth');
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMethods, setLoginMethods] = useState<LoginMethods>(DEFAULT_LOGIN_METHODS);

  useEffect(() => {
    let isMounted = true;

    const loadLoginMethods = async () => {
      try {
        const methods = await authApi.getLoginMethods();
        if (isMounted) {
          setLoginMethods(methods);
        }
      } catch {
        if (isMounted) {
          setLoginMethods(DEFAULT_LOGIN_METHODS);
        }
      }
    };

    void loadLoginMethods();

    return () => {
      isMounted = false;
    };
  }, []);

  const canSubmit = email.includes('@') && password.length >= 6;
  const emailPasswordEnabled = loginMethods.emailPassword;
  const googleEnabledByBackend = loginMethods.google;
  const facebookEnabledByBackend = loginMethods.facebook;
  const googleSupportedInBuild = isGoogleLoginConfigured();
  const facebookConfigured = isFacebookLoginConfigured();
  const hasEnabledMethod =
    emailPasswordEnabled || googleEnabledByBackend || facebookEnabledByBackend;

  const handleLogin = async () => {
    if (!canSubmit || isSubmitting || !emailPasswordEnabled) return;

    try {
      setIsSubmitting(true);
      await login({ email: email.trim(), password });
      continueAfterLogin();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('loginFailed'),
        text2: error?.message || t('tryAgain'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout terms={t('terms')}>
        <View
          accessibilityLabel="MemoPal app icon"
          className="self-center mb-6 h-24 w-24 overflow-hidden rounded-[26px]"
          style={{ boxShadow: '0px 5px 12px rgba(43, 38, 65, 0.22)' }}>
          <Image
            source={require('../../../../assets/images/momo-ray-icon.png')}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </View>

        <Text className="mb-2 text-center text-3xl font-semibold text-ink">{t('welcome')}</Text>

        <Text className="mb-8  text-center text-ink-soft">{t('signInDescription')}</Text>

        {!hasEnabledMethod && (
          <Text className="mb-4  text-center text-sm text-accent-berry">
            {t('loginUnavailable')}
          </Text>
        )}

        {emailPasswordEnabled && (
          <>
            <View className="mb-5 w-full gap-3">
              <AuthField
                value={email}
                onChangeText={setEmail}
                label={t('email')}
                placeholder={t('email')}
                keyboardType="email-address"
                autoComplete="email"
                autoCorrect={false}
                autoCapitalize="none"
              />
              <AuthField
                value={password}
                onChangeText={setPassword}
                label={t('password')}
                placeholder={t('password')}
                autoComplete="current-password"
                secureTextEntry
              />
            </View>

            <AnimatedPressable
              containerStyle={{ alignSelf: 'stretch' }}
              onPress={handleLogin}
              disabled={!canSubmit || isSubmitting}
              className={`mb-5 h-14 w-full flex-row items-center justify-center rounded-2xl px-12 ${!canSubmit || isSubmitting ? 'bg-line' : 'bg-primary'}`}
              style={
                !canSubmit || isSubmitting
                  ? undefined
                  : { boxShadow: '0px 4px 0px rgba(105, 80, 204, 0.28)' }
              }>
              <Text
                className={`font-medium ${!canSubmit || isSubmitting ? 'text-ink-soft' : 'text-white'}`}>
                {isSubmitting ? t('signingIn') : t('signIn')}
              </Text>
            </AnimatedPressable>
          </>
        )}

        {emailPasswordEnabled && (googleEnabledByBackend || facebookEnabledByBackend) && (
          <View className="mb-4 w-full flex-row items-center gap-3">
            <View className="h-px flex-1 bg-line" />
            <Text className="text-xs font-semibold text-ink-soft">{t('orContinueWith')}</Text>
            <View className="h-px flex-1 bg-line" />
          </View>
        )}

        {googleEnabledByBackend && (
          <AnimatedPressable
              containerStyle={{ alignSelf: 'stretch' }}
            onPress={async () => {
              if (!googleSupportedInBuild) {
                Toast.show({
                  type: 'info',
                  text1: t('googleUnavailable'),
                  text2: t('googleConfig'),
                });
                return;
              }
              try {
                setIsSubmitting(true);
                const idToken = await getGoogleIdToken();
                await loginWithGoogle(idToken);
                continueAfterLogin();
              } catch (error: any) {
                Toast.show({
                  type: 'error',
                  text1: t('loginFailed'),
                  text2: error?.message || t('tryAgain'),
                });
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
            className="mb-2 w-full flex-row items-center justify-center gap-3 rounded-2xl border-2 border-line bg-surface px-6 py-4">
            <Image
              source={require('../../../../assets/images/google-icon.png')}
              style={{ width: 18, height: 18 }}
              contentFit="contain"
            />
            <Text className="font-medium text-ink">{t('continueGoogle')}</Text>
          </AnimatedPressable>
        )}

        {facebookEnabledByBackend && (
          <AnimatedPressable
              containerStyle={{ alignSelf: 'stretch' }}
            onPress={async () => {
              if (!facebookConfigured) {
                Toast.show({
                  type: 'info',
                  text1: 'Facebook sign-in unavailable',
                  text2: 'Set EXPO_PUBLIC_FACEBOOK_OAUTH_URL in your app environment.',
                });
                return;
              }
              try {
                setIsSubmitting(true);
                const token = await getFacebookAccessToken();
                await loginWithFacebook(token);
                continueAfterLogin();
              } catch (error: any) {
                Toast.show({
                  type: 'error',
                  text1: 'Facebook login failed',
                  text2: error?.message || 'Please try again.',
                });
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
            className="mb-3 w-full flex-row items-center justify-center gap-3 rounded-2xl border-2 border-line bg-surface px-6 py-4">
            <Ionicons name="logo-facebook" size={18} color="#1877F2" />
            <Text className="font-medium text-ink">{t('continueFacebook')}</Text>
          </AnimatedPressable>
        )}

        <AnimatedPressable onPress={() => router.push({ pathname: '/register', params: returnTo ? { returnTo } : {} })} className="min-h-11 items-center justify-center">
          <Text className="text-primary-active">{t('noAccount')}</Text>
        </AnimatedPressable>
    </AuthLayout>
  );
};
