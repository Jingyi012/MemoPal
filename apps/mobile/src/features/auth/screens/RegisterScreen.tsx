import { authApi } from '@/features/auth/api/auth';
import { referralApi } from '@/features/referral/api/referral';
import AnimatedPressable from '@/components/AnimatedPressable';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { useAuth } from '@/contexts/AuthProvider';
import {
  getFacebookAccessToken,
  getGoogleIdToken,
  isFacebookLoginConfigured,
  isGoogleLoginConfigured,
} from '@/features/auth/services/socialAuth.service';
import { syncEntitlementToLocal } from '@/features/subscription/services/subscription.service';
import { LoginMethods } from '@/features/auth/types/auth';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from '@/core/i18n/useTranslation';

const DEFAULT_LOGIN_METHODS: LoginMethods = {
  emailPassword: true,
  google: true,
  facebook: false,
};

export default function Register() {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const { register, loginWithGoogle, loginWithFacebook } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
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

      router.replace('/(tabs)');
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
    <View className="flex-1 bg-[#FFFDF8]">
      <View className="flex-1 items-center justify-center px-8">
        <LinearGradient
          colors={[theme.violetDeep, theme.berryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 10, boxShadow: '0px 4px 12px rgba(43, 42, 61, 0.16)' }}
          className="mb-6 h-20 w-20 items-center justify-center"
          >
          <Text className="text-4xl">🧠</Text>
        </LinearGradient>

        <Text className="mb-2 text-2xl font-semibold text-[#2B2A3D]">{t('signUp')}</Text>

        <Text className="mb-8 max-w-sm text-center text-[#6B6A80]">
          {t('createDescription')}
        </Text>

        {!hasEnabledMethod && (
          <Text className="mb-4 max-w-sm text-center text-sm text-[#E8527A]">
            {t('registrationUnavailable')}
          </Text>
        )}

        {emailPasswordEnabled && (
          <>
            <View className="mb-4 w-full max-w-sm gap-3">
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t('displayName')}
                className="rounded-2xl border-2 border-[#EEE9DC] bg-white px-4 py-3"
                autoCapitalize="words"
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('email')}
                keyboardType="email-address"
                autoCapitalize="none"
                className="rounded-2xl border-2 border-[#EEE9DC] bg-white px-4 py-3"
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t('passwordHint')}
                secureTextEntry
                className="rounded-2xl border-2 border-[#EEE9DC] bg-white px-4 py-3"
              />
              <TextInput
                value={referralCode}
                onChangeText={setReferralCode}
                placeholder={t('referralCode')}
                autoCapitalize="characters"
                className="rounded-2xl border-2 border-[#EEE9DC] bg-white px-4 py-3"
              />
            </View>

            <AnimatedPressable
              onPress={handleRegister}
              disabled={!canSubmit || isSubmitting}
              className={`mb-3 w-full max-w-sm items-center justify-center rounded-2xl px-6 py-4 ${!canSubmit || isSubmitting ? 'bg-[#D8D4C9]' : 'bg-[#FFC93C]'}`}>
              <Text className={`font-medium ${!canSubmit || isSubmitting ? 'text-[#9A97A7]' : 'text-[#2B2A3D]'}`}>
                {isSubmitting ? t('creatingAccount') : t('signUp')}
              </Text>
            </AnimatedPressable>
          </>
        )}

        {googleEnabledByBackend && (
          <AnimatedPressable
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
                router.replace('/(tabs)');
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
            className="mb-2 w-full max-w-sm flex-row items-center justify-center gap-3 rounded-2xl border-2 border-[#EEE9DC] bg-white px-6 py-4">
            <Image
              source={require('../../../../assets/images/google-icon.png')}
              style={{ width: 18, height: 18 }}
              contentFit="contain"
            />
            <Text className="font-medium text-[#2B2A3D]">{t('continueGoogle')}</Text>
          </AnimatedPressable>
        )}

        {facebookEnabledByBackend && (
          <AnimatedPressable
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
                router.replace('/(tabs)');
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
            className="mb-3 w-full max-w-sm flex-row items-center justify-center gap-3 rounded-2xl border-2 border-[#EEE9DC] bg-white px-6 py-4">
            <Ionicons name="logo-facebook" size={18} color="#1877F2" />
            <Text className="font-medium text-[#2B2A3D]">{t('continueFacebook')}</Text>
          </AnimatedPressable>
        )}

        <AnimatedPressable onPress={() => router.replace('/login')} className="mb-4">
          <Text className="text-[#7A68E0]">{t('hasAccount')}</Text>
        </AnimatedPressable>
      </View>

      <View className="p-6">
        <Text className="text-center text-xs text-[#9A97A7]">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}
