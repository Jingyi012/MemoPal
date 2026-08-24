import { authApi } from '@/features/auth/api/auth';
import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Brain } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

const DEFAULT_LOGIN_METHODS: LoginMethods = {
  emailPassword: true,
  google: true,
  facebook: false,
};

export const LoginScreen: React.FC = () => {
  const router = useRouter();
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
  const hasEnabledMethod = emailPasswordEnabled || googleEnabledByBackend || facebookEnabledByBackend;

  const handleLogin = async () => {
    if (!canSubmit || isSubmitting || !emailPasswordEnabled) return;

    try {
      setIsSubmitting(true);
      await login({ email: email.trim(), password });
      router.replace('/(tabs)');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: error?.message || 'Please check your credentials and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <LinearGradient
          colors={[Colors.teal600, Colors.indigo600]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 10 }}
          className="mb-6 h-20 w-20 items-center justify-center shadow-lg">
          <Brain size={40} color="white" strokeWidth={1.5} />
        </LinearGradient>

        <Text className="mb-2 text-2xl font-semibold text-gray-900">Welcome to MemoPal</Text>

        <Text className="mb-8 max-w-sm text-center text-gray-600">
          Sign in to sync your progress across all your devices and unlock premium features
        </Text>

        {!hasEnabledMethod && (
          <Text className="mb-4 max-w-sm text-center text-sm text-rose-600">
            Login is temporarily unavailable. Please contact support.
          </Text>
        )}

        {emailPasswordEnabled && (
          <>
            <View className="mb-4 w-full max-w-sm gap-3">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                className="rounded-xl border-2 border-gray-200 px-4 py-3"
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
                className="rounded-xl border-2 border-gray-200 px-4 py-3"
              />
            </View>

            <AnimatedPressable
              onPress={handleLogin}
              disabled={!canSubmit || isSubmitting}
              className={`mb-3 w-full max-w-sm items-center justify-center rounded-xl px-6 py-4 ${!canSubmit || isSubmitting ? 'bg-gray-300' : 'bg-teal-600'}`}>
              <Text className="font-medium text-white">
                {isSubmitting ? 'Signing in...' : 'Sign In'}
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
            className="mb-2 w-full max-w-sm flex-row items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4">
            <Image
              source={require('../../../../assets/images/google-icon.png')}
              style={{ width: 18, height: 18 }}
              contentFit="contain"
            />
            <Text className="font-medium text-slate-700">Continue with Google</Text>
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
            className="mb-3 w-full max-w-sm flex-row items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4">
            <Ionicons name="logo-facebook" size={18} color="#1877F2" />
            <Text className="font-medium text-slate-700">Continue with Facebook</Text>
          </AnimatedPressable>
        )}

        <AnimatedPressable onPress={() => router.push('/register')} className="mb-4">
          <Text className="text-slate-500">Don&apos;t have an account? Create one</Text>
        </AnimatedPressable>
      </View>

      <View className="p-6">
        <Text className="text-center text-xs text-gray-400">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
};
