import { AuthLayout } from '../components/AuthLayout';
import { AuthField } from '../components/AuthField';
import { authApi } from '@/features/auth/api/auth';
import { referralApi } from '@/features/referral/api/referral';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useColorScheme } from 'nativewind';
import { memopalThemes } from '@/theme/memopalTheme';
import { useAuth } from '@/contexts/AuthProvider';
import {
  getFacebookAccessToken,
  getGoogleIdToken,
  isFacebookLoginConfigured,
  isGoogleLoginConfigured,
} from '@/features/auth/services/socialAuth.service';
import { syncEntitlementToLocal } from '@/features/subscription/services/subscription.service';
import { LoginMethods } from '@/features/auth/types/auth';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from '@/core/i18n/useTranslation';
import { getSafeAuthReturnTo } from '@/features/auth/utils/safeAuthReturnTo';
import { getSafeReferralCode } from '@/features/auth/utils/safeReferralCode';

const DEFAULT_LOGIN_METHODS: LoginMethods = {
  emailPassword: true,
  google: true,
  facebook: false,
};

export default function Register() {
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const router = useRouter();
  const { returnTo: returnToParam, referralCode: referralCodeParam } = useLocalSearchParams<{ returnTo?: string | string[]; referralCode?: string | string[] }>();
  const returnTo = getSafeAuthReturnTo(Array.isArray(returnToParam) ? returnToParam[0] : returnToParam);
  const linkedReferralCode = getSafeReferralCode(Array.isArray(referralCodeParam) ? referralCodeParam[0] : referralCodeParam);
  const continueAfterRegistration = () => router.replace((returnTo ?? '/') as Href);
  const { t } = useTranslation('auth');
  const { register, loginWithGoogle, loginWithFacebook } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(linkedReferralCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMethods, setLoginMethods] = useState<LoginMethods>(DEFAULT_LOGIN_METHODS);

  useEffect(() => {
    if (linkedReferralCode) setReferralCode(current => current || linkedReferralCode);
  }, [linkedReferralCode]);

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

  const canSubmit = displayName.trim().length > 1 && email.includes('@') && password.length >= 6;
  const emailPasswordEnabled = loginMethods.emailPassword;
  const googleEnabledByBackend = loginMethods.google;
  const facebookEnabledByBackend = loginMethods.facebook;
  const googleSupportedInBuild = isGoogleLoginConfigured();
  const facebookConfigured = isFacebookLoginConfigured();
  const hasEnabledMethod = emailPasswordEnabled || googleEnabledByBackend || facebookEnabledByBackend;

  const handleRegister = async () => {
    if (!canSubmit || isSubmitting || !emailPasswordEnabled) return;

    try {
      setIsSubmitting(true);
      await register({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
      });

      const normalizedReferralCode = referralCode.trim().toUpperCase();
      if (normalizedReferralCode) {
        try {
          await referralApi.redeem(normalizedReferralCode);
          await syncEntitlementToLocal();
          Toast.show({
            type: 'success',
            text1: 'Referral applied',
            text2: 'Your referral rewards were added.',
          });
        } catch (referralError: any) {
          Toast.show({
            type: 'info',
            text1: 'Account created',
            text2:
              referralError?.message ||
              'We could not apply the referral code. You can redeem it later in Referral screen.',
          });
        }
      }

      continueAfterRegistration();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('registrationFailed'),
        text2: error?.message || t('tryAgain'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout terms={t('terms')}>
        <LinearGradient
          colors={[theme.violetDeep, theme.berryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 10, boxShadow: '0px 4px 12px rgba(43, 42, 61, 0.16)' }}
          className="self-center mb-6 h-20 w-20 items-center justify-center"
          >
          <Text className="text-4xl">🧠</Text>
        </LinearGradient>

        <Text className="mb-2 text-center text-3xl font-semibold text-ink">{t('signUp')}</Text>

        <Text className="mb-8  text-center text-ink-soft">
          {t('createDescription')}
        </Text>

        {!hasEnabledMethod && (
          <Text className="mb-4  text-center text-sm text-accent-berry">
            {t('registrationUnavailable')}
          </Text>
        )}

        {emailPasswordEnabled && (
          <>
            <View className="mb-4 w-full gap-3">
              <AuthField
                value={displayName}
                onChangeText={setDisplayName}
                label={t('displayName')}
                placeholder={t('displayName')}
                autoCapitalize="words"
              />
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
                placeholder={t('passwordHint')}
                autoComplete="new-password"
                secureTextEntry
              />
              <AuthField
                value={referralCode}
                onChangeText={setReferralCode}
                label={t('referralCode')}
                placeholder={t('referralCode')}
                autoCapitalize="characters"
              />
            </View>

            <AnimatedPressable
              containerStyle={{ alignSelf: 'stretch' }}
              onPress={handleRegister}
              disabled={!canSubmit || isSubmitting}
              className={`mb-3 w-full items-center justify-center rounded-2xl px-6 py-4 ${!canSubmit || isSubmitting ? 'bg-line' : 'bg-primary'}`}>
              <Text className={`font-medium ${!canSubmit || isSubmitting ? 'text-ink-soft' : 'text-white'}`}>
                {isSubmitting ? t('creatingAccount') : t('signUp')}
              </Text>
            </AnimatedPressable>
          </>
        )}

        {googleEnabledByBackend && (
          <AnimatedPressable
              containerStyle={{ alignSelf: 'stretch' }}
            onPress={async () => {
              if (!googleSupportedInBuild) {
                Toast.show({
                  type: 'info',
                  text1: 'Google sign-in unavailable',
                  text2:
                    'Use an Expo development/production build and configure Google OAuth client IDs.',
                });
                return;
              }
              try {
                setIsSubmitting(true);
                const idToken = await getGoogleIdToken();
                await loginWithGoogle(idToken);
                continueAfterRegistration();
              } catch (error: any) {
                Toast.show({
                  type: 'error',
                  text1: 'Google login failed',
                  text2: error?.message || 'Please try again.',
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
                continueAfterRegistration();
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

        <AnimatedPressable onPress={() => router.replace({ pathname: '/login', params: returnTo ? { returnTo } : {} })} className="min-h-11 items-center justify-center">
          <Text className="text-primary-active">{t('hasAccount')}</Text>
        </AnimatedPressable>
    </AuthLayout>
  );
}
